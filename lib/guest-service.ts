import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User, Workspace, Team, Task, Report } from './types';

export interface GuestData {
  userId: string;
  workspaceId: string;
  createdAt: Date;
  lastActive: Date;
  data: {
    teams: Team[];
    tasks: Task[];
    reports: Report[];
  };
}

export class GuestService {
  private static readonly GUEST_WORKSPACE_ID = 'guest-workspace';
  private static readonly GUEST_COLLECTION = 'guest-data';

  /**
   * Create a temporary guest workspace
   */
  static async createGuestWorkspace(userId: string): Promise<Workspace> {
    const workspace: Workspace = {
      id: this.GUEST_WORKSPACE_ID,
      name: 'Guest Workspace',
      description: 'Temporary workspace for guest users',
      type: 'other',
      ownerId: userId,
      workspaceType: 'main',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        allowSubWorkspaces: false,
        maxSubWorkspaces: 0,
        inheritUsers: false,
        inheritRoles: false,
        inheritTeams: false,
        inheritBranches: false,
        crossWorkspaceReporting: false,
        allowAdminWorkspaceCreation: false,
      },
    };

    // Store guest workspace data
    await setDoc(doc(db, this.GUEST_COLLECTION, userId), {
      userId,
      workspaceId: this.GUEST_WORKSPACE_ID,
      createdAt: new Date(),
      lastActive: new Date(),
      data: {
        teams: [],
        tasks: [],
        reports: [],
      },
    });

    return workspace;
  }

  /**
   * Get guest data for a user
   */
  static async getGuestData(userId: string): Promise<GuestData | null> {
    try {
      const docRef = doc(db, this.GUEST_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as GuestData;
      }
      return null;
    } catch (error) {
      console.error('Error getting guest data:', error);
      return null;
    }
  }

  /**
   * Update guest data
   */
  static async updateGuestData(userId: string, data: Partial<GuestData['data']>): Promise<void> {
    try {
      const docRef = doc(db, this.GUEST_COLLECTION, userId);
      await updateDoc(docRef, {
        lastActive: new Date(),
        data: data,
      });
    } catch (error) {
      console.error('Error updating guest data:', error);
    }
  }

  /**
   * Create sample data for guest users
   */
  static async createSampleGuestData(userId: string): Promise<void> {
    const sampleTeams: Team[] = [
      {
        id: 'guest-team-1',
        name: 'Sample Team',
        description: 'A sample team to demonstrate the application',
        workspaceId: this.GUEST_WORKSPACE_ID,
        branchId: undefined,
        regionId: undefined,
        leadId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      },
    ];

    const sampleTasks: Task[] = [
      {
        id: 'guest-task-1',
        title: 'Welcome Task',
        description: 'This is a sample task to help you explore the application',
        projectId: 'guest-project-1',
        workspaceId: this.GUEST_WORKSPACE_ID,
        assigneeId: userId,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ['sample', 'welcome'],
        attachments: [],
        comments: [],
        createdBy: userId,
        visibility: 'public',
        permissions: {
          canView: [userId],
          canEdit: [userId],
          canDelete: [userId],
          canComment: [userId],
          canAssign: [userId],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'guest-task-2',
        title: 'Explore Features',
        description: 'Try out different features of the application',
        projectId: 'guest-project-1',
        workspaceId: this.GUEST_WORKSPACE_ID,
        assigneeId: userId,
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        tags: ['exploration', 'features'],
        attachments: [],
        comments: [],
        createdBy: userId,
        visibility: 'public',
        permissions: {
          canView: [userId],
          canEdit: [userId],
          canDelete: [userId],
          canComment: [userId],
          canAssign: [userId],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const sampleReports: Report[] = [
      {
        id: 'guest-report-1',
        title: 'Sample Report',
        content: 'This is a sample report to demonstrate the reporting features',
        type: 'custom',
        workspaceId: this.GUEST_WORKSPACE_ID,
        authorId: userId,
        status: 'draft',
        attachments: [],
        metadata: {
          department: 'Sample Department',
          category: 'Demo',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await this.updateGuestData(userId, {
      teams: sampleTeams,
      tasks: sampleTasks,
      reports: sampleReports,
    });
  }

  /**
   * Clean up guest data when user logs out
   */
  static async cleanupGuestData(userId: string): Promise<void> {
    try {
      // Delete guest data after a delay to allow for potential re-login
      setTimeout(async () => {
        try {
          await deleteDoc(doc(db, this.GUEST_COLLECTION, userId));
          console.log('Guest data cleaned up for user:', userId);
        } catch (error) {
          console.error('Error cleaning up guest data:', error);
        }
      }, 5 * 60 * 1000); // 5 minutes delay
    } catch (error) {
      console.error('Error scheduling guest data cleanup:', error);
    }
  }

  /**
   * Get sample workspace data for guest users
   */
  static getSampleWorkspaceData() {
    return {
      workspace: {
        id: this.GUEST_WORKSPACE_ID,
        name: 'Guest Workspace',
        description: 'Temporary workspace for exploring the application',
        type: 'other',
        ownerId: 'guest-user',
        workspaceType: 'main',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      teams: [
        {
          id: 'guest-team-1',
          name: 'Sample Team',
          description: 'A sample team to demonstrate the application',
          workspaceId: this.GUEST_WORKSPACE_ID,
          memberCount: 1,
          role: 'member',
          branchId: undefined,
          regionId: undefined,
          leadId: 'guest-user',
          createdAt: new Date(),
        },
      ],
      tasks: [
        {
          id: 'guest-task-1',
          title: 'Welcome Task',
          description: 'This is a sample task to help you explore the application',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          assigneeId: 'guest-user',
          createdBy: 'guest-user',
          workspaceId: this.GUEST_WORKSPACE_ID,
        },
        {
          id: 'guest-task-2',
          title: 'Explore Features',
          description: 'Try out different features of the application',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          assigneeId: 'guest-user',
          createdBy: 'guest-user',
          workspaceId: this.GUEST_WORKSPACE_ID,
        },
      ],
      reports: [
        {
          id: 'guest-report-1',
          title: 'Sample Report',
          content: 'This is a sample report to demonstrate the reporting features',
          type: 'custom',
          status: 'draft',
          authorId: 'guest-user',
          workspaceId: this.GUEST_WORKSPACE_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  }

  /**
   * Check if a user is a guest
   */
  static isGuestUser(user: any): boolean {
    return user && user.isAnonymous;
  }

  /**
   * Get guest workspace ID
   */
  static getGuestWorkspaceId(): string {
    return this.GUEST_WORKSPACE_ID;
  }

  /**
   * Get or create a shared guest account for demo purposes
   * This reduces the number of anonymous accounts created
   */
  static async getSharedGuestAccount(): Promise<string> {
    try {
      // Check if there's an existing shared guest account
      const sharedGuestDoc = await getDoc(doc(db, 'shared-guest', 'demo-account'));
      
      if (sharedGuestDoc.exists()) {
        const data = sharedGuestDoc.data();
        return data.userId || 'shared-guest-demo';
      }
      
      // Create a new shared guest account
      const sharedGuestId = 'shared-guest-demo-' + Date.now();
      await setDoc(doc(db, 'shared-guest', 'demo-account'), {
        userId: sharedGuestId,
        createdAt: new Date(),
        lastUsed: new Date(),
      });
      
      return sharedGuestId;
    } catch (error) {
      console.error('Error getting shared guest account:', error);
      return 'shared-guest-demo';
    }
  }

  /**
   * Update shared guest account usage
   */
  static async updateSharedGuestUsage(): Promise<void> {
    try {
      await updateDoc(doc(db, 'shared-guest', 'demo-account'), {
        lastUsed: new Date(),
      });
    } catch (error) {
      console.error('Error updating shared guest usage:', error);
    }
  }
} 