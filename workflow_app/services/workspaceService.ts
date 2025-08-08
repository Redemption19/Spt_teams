import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, Firestore } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Workspace, WorkspaceMember } from '../types';

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  type: 'company' | 'nonprofit' | 'government' | 'education' | 'other';
  ownerId: string;
}

export class WorkspaceService {
  // Create a new workspace
  static async createWorkspace(workspaceData: CreateWorkspaceData, ownerId: string): Promise<string> {
    try {
      const workspaceId = `workspace-${Date.now()}`;
      
      const workspace: Workspace = {
        id: workspaceId,
        name: workspaceData.name,
        description: workspaceData.description || '',
        ownerId: ownerId,
        settings: {
          currency: 'USD',
          timezone: 'UTC',
          features: {
            tasks: true,
            financial: true,
            hr: true,
            analytics: true,
            ai: true,
          }
        },
        stats: {
          memberCount: 1,
          taskCount: 0,
          activeProjects: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Create workspace document
      await setDoc(doc(db, 'workspaces', workspaceId), {
        ...workspace,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add owner as workspace member
      const memberData: WorkspaceMember = {
        id: `${workspaceId}_${ownerId}`,
        userId: ownerId,
        workspaceId: workspaceId,
        role: 'owner',
        permissions: ['all'],
        joinedAt: new Date(),
      };

      await setDoc(doc(db, 'workspace_members', `${workspaceId}_${ownerId}`), {
        ...memberData,
        joinedAt: serverTimestamp(),
      });

      return workspaceId;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new Error('Failed to create workspace');
    }
  }

  // Get workspaces for a user
  static async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    try {
      // Get workspace memberships
      const membershipsQuery = query(
        collection(db, 'workspace_members'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const workspaceIds = membershipsSnapshot.docs.map(doc => doc.data().workspaceId);

      if (workspaceIds.length === 0) {
        return [];
      }

      // Get workspace details
      const workspaces: Workspace[] = [];
      for (const workspaceId of workspaceIds) {
        const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
        if (workspaceDoc.exists()) {
          workspaces.push(workspaceDoc.data() as Workspace);
        }
      }

      return workspaces;
    } catch (error) {
      console.error('Error getting user workspaces:', error);
      throw new Error('Failed to get user workspaces');
    }
  }

  // Get workspace by ID
  static async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    try {
      const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
      if (workspaceDoc.exists()) {
        return workspaceDoc.data() as Workspace;
      }
      return null;
    } catch (error) {
      console.error('Error getting workspace:', error);
      throw new Error('Failed to get workspace');
    }
  }

  // Add user to workspace
  static async addUserToWorkspace(workspaceId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member', invitedBy?: string): Promise<void> {
    try {
      const memberData: WorkspaceMember = {
        id: `${workspaceId}_${userId}`,
        userId: userId,
        workspaceId: workspaceId,
        role: role,
        permissions: role === 'owner' ? ['all'] : ['read', 'write'],
        joinedAt: new Date(),
      };

      await setDoc(doc(db, 'workspace_members', `${workspaceId}_${userId}`), {
        ...memberData,
        joinedAt: serverTimestamp(),
      });

      // Update workspace stats
      const workspaceRef = doc(db, 'workspaces', workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);
      if (workspaceDoc.exists()) {
        const workspace = workspaceDoc.data() as Workspace;
        await setDoc(workspaceRef, {
          ...workspace,
          stats: {
            ...workspace.stats,
            memberCount: (workspace.stats?.memberCount || 0) + 1,
          },
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error adding user to workspace:', error);
      throw new Error('Failed to add user to workspace');
    }
  }

  // Get workspace members
  static async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const membersQuery = query(
        collection(db, 'workspace_members'),
        where('workspaceId', '==', workspaceId),
        where('isActive', '==', true)
      );
      
      const membersSnapshot = await getDocs(membersQuery);
      return membersSnapshot.docs.map(doc => doc.data() as WorkspaceMember);
    } catch (error) {
      console.error('Error getting workspace members:', error);
      throw new Error('Failed to get workspace members');
    }
  }

  // Update workspace
  static async updateWorkspace(workspaceId: string, updates: Partial<Workspace>): Promise<void> {
    try {
      await setDoc(doc(db, 'workspaces', workspaceId), {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw new Error('Failed to update workspace');
    }
  }

  // Delete workspace (only for owners)
  static async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    try {
      // Check if user is owner
      const workspace = await this.getWorkspaceById(workspaceId);
      if (!workspace || workspace.ownerId !== userId) {
        throw new Error('Insufficient permissions to delete workspace');
      }

      // TODO: Implement workspace deletion logic
      // This would involve deleting all related data (tasks, documents, etc.)
      throw new Error('Workspace deletion not yet implemented');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }
}
