'use client';

import { 
  doc, 
  collection,
  addDoc,
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, Task, Epic, User } from './types';
import { ActivityService } from './activity-service';

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'epics' | 'visibility' | 'projectAdmins' | 'projectMembers' | 'permissions'>, createdBy?: string): Promise<string> {
    try {
      const projectsRef = collection(db, 'projects');
      
      const newProject = {
        ...projectData,
        epics: [],
        progress: 0,
        // === DEFAULT RBAC SETTINGS ===
        visibility: 'public' as const, // Default to public visibility
        projectAdmins: [], // No project admins initially
        projectMembers: [], // No project members initially
        permissions: {
          canView: [], // Empty means only explicit permissions
          canEdit: [], // Only owner and system admins can edit by default
          canDelete: [], // Only owner can delete by default
          canManageTasks: [], // Only owner and admins can manage tasks by default
          canAssignTasks: [], // Only owner and admins can assign tasks by default
          canManageMembers: [], // Only owner and admins can manage members by default
        },
        // === PROJECT COMMENTS ===
        comments: [], // Initialize with empty comments array
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(projectsRef, newProject);

      // Log activity
      if (createdBy) {
        try {
          await ActivityService.logActivity(
            'project_created',
            'project',
            docRef.id,
            {
              targetName: projectData.name,
              teamId: projectData.teamId,
              priority: projectData.priority,
              status: projectData.status,
              visibility: 'public',
            },
            projectData.workspaceId,
            createdBy
          );
        } catch (activityError) {
          console.error('Error logging project creation activity:', activityError);
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Get all projects for a workspace
   */
  static async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
        } as Project);
      });

      return projects;
    } catch (error) {
      console.error('Error getting workspace projects:', error);
      throw new Error('Failed to get workspace projects');
    }
  }

  /**
   * Get projects by team
   */
  static async getTeamProjects(teamId: string): Promise<Project[]> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('teamId', '==', teamId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
        } as Project);
      });

      return projects;
    } catch (error) {
      console.error('Error getting team projects:', error);
      throw new Error('Failed to get team projects');
    }
  }

  /**
   * Get projects by department
   */
  static async getDepartmentProjects(departmentId: string): Promise<Project[]> {
    try {
      // Input validation
      if (!departmentId || typeof departmentId !== 'string' || departmentId.trim() === '') {
        throw new Error('Invalid department ID provided');
      }

      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('departmentId', '==', departmentId.trim()),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        try {
          projects.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            startDate: data.startDate?.toDate(),
            dueDate: data.dueDate?.toDate(),
          } as Project);
        } catch (docError) {
          console.warn(`Skipping invalid project document ${doc.id}:`, docError);
        }
      });

      return projects;
    } catch (error) {
      console.error('Error getting department projects:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get department projects');
    }
  }

  /**
   * Assign project to department
   */
  static async assignProjectToDepartment(projectId: string, departmentId: string, assignedBy: string): Promise<void> {
    try {
      // Input validation
      if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
        throw new Error('Invalid project ID provided');
      }
      if (!departmentId || typeof departmentId !== 'string' || departmentId.trim() === '') {
        throw new Error('Invalid department ID provided');
      }
      if (!assignedBy || typeof assignedBy !== 'string' || assignedBy.trim() === '') {
        throw new Error('Invalid user ID provided for assignment');
      }

      const project = await this.getProject(projectId.trim());
      if (!project) {
        throw new Error(`Project with ID '${projectId}' not found`);
      }

      // Check if project is already assigned to this department
      if (project.departmentId === departmentId.trim()) {
        throw new Error('Project is already assigned to this department');
      }

      // Check if project is archived or completed
      if (project.status === 'archived') {
        throw new Error('Cannot assign archived projects to departments');
      }

      const projectRef = doc(db, 'projects', projectId.trim());
      await updateDoc(projectRef, {
        departmentId: departmentId.trim(),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      try {
        await ActivityService.logActivity(
          'project_updated',
          'project',
          projectId,
          {
            targetName: project.name,
            previousDepartmentId: project.departmentId || null,
            newDepartmentId: departmentId.trim(),
            action: 'department_assigned',
          },
          project.workspaceId,
          assignedBy.trim()
        );
      } catch (activityError) {
        console.warn('Failed to log department assignment activity:', activityError);
      }
    } catch (error) {
      console.error('Error assigning project to department:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to assign project to department');
    }
  }

  /**
   * Remove project from department
   */
  static async removeProjectFromDepartment(projectId: string, removedBy: string): Promise<void> {
    try {
      // Input validation
      if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
        throw new Error('Invalid project ID provided');
      }
      if (!removedBy || typeof removedBy !== 'string' || removedBy.trim() === '') {
        throw new Error('Invalid user ID provided for removal');
      }

      const project = await this.getProject(projectId.trim());
      if (!project) {
        throw new Error(`Project with ID '${projectId}' not found`);
      }

      // Check if project is not assigned to any department
      if (!project.departmentId) {
        throw new Error('Project is not assigned to any department');
      }

      // Check if project is archived
      if (project.status === 'archived') {
        throw new Error('Cannot modify department assignment for archived projects');
      }

      const previousDepartmentId = project.departmentId;
      const projectRef = doc(db, 'projects', projectId.trim());
      await updateDoc(projectRef, {
        departmentId: null,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      try {
        await ActivityService.logActivity(
          'project_updated',
          'project',
          projectId,
          {
            targetName: project.name,
            previousDepartmentId,
            action: 'department_removed',
          },
          project.workspaceId,
          removedBy.trim()
        );
      } catch (activityError) {
        console.warn('Failed to log department removal activity:', activityError);
      }
    } catch (error) {
      console.error('Error removing project from department:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to remove project from department');
    }
  }

  /**
   * Get a single project by ID
   */
  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const data = projectSnap.data();
        return {
          id: projectSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw new Error('Failed to get project');
    }
  }

  /**
   * Update project
   */
  static async updateProject(projectId: string, updates: Partial<Project>, updatedBy?: string): Promise<void> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Get current project data for activity logging
      const currentProject = await this.getProject(projectId);
      
      // Remove read-only fields
      const { id, createdAt, epics, ...updateData } = updates;
      
      await updateDoc(projectRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      if (updatedBy && currentProject) {
        try {
          await ActivityService.logActivity(
            'project_updated',
            'project',
            projectId,
            {
              targetName: updates.name || currentProject.name,
              changes: Object.keys(updateData),
              previousValues: Object.keys(updateData).reduce((prev, key) => {
                prev[key] = currentProject[key as keyof Project];
                return prev;
              }, {} as Record<string, any>),
            },
            currentProject.workspaceId,
            updatedBy
          );
        } catch (activityError) {
          console.error('Error logging project update activity:', activityError);
        }
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string, deletedBy?: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Delete all related tasks and epics
      await this.deleteProjectTasks(projectId);
      await this.deleteProjectEpics(projectId);

      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);

      // Log activity
      if (deletedBy) {
        try {
          await ActivityService.logActivity(
            'project_deleted',
            'project',
            projectId,
            {
              targetName: project.name,
              teamId: project.teamId,
              hadTasks: project.epics?.length || 0,
            },
            project.workspaceId,
            deletedBy
          );
        } catch (activityError) {
          console.error('Error logging project deletion activity:', activityError);
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Update project progress based on task completion
   */
  static async updateProjectProgress(projectId: string): Promise<void> {
    try {
      // Get project tasks
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
          comments: data.comments || [],
          attachments: data.attachments || [],
          tags: data.tags || [],
        } as Task);
      });

      if (tasks.length === 0) {
        return;
      }

      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const progress = Math.round((completedTasks / tasks.length) * 100);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        progress,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  }

  /**
   * Get project tasks
   */
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
        } as Task);
      });

      return tasks;
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw new Error('Failed to get project tasks');
    }
  }

  /**
   * Get project epics
   */
  static async getProjectEpics(projectId: string): Promise<Epic[]> {
    try {
      const epicsRef = collection(db, 'epics');
      const q = query(
        epicsRef,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const epics: Epic[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        epics.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
        } as Epic);
      });

      return epics;
    } catch (error) {
      console.error('Error getting project epics:', error);
      throw new Error('Failed to get project epics');
    }
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalEpics: number;
    completedEpics: number;
    progress: number;
    teamMembers: number;
  }> {
    try {
      // Get project tasks
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
          comments: data.comments || [],
          attachments: data.attachments || [],
          tags: data.tags || [],
        } as Task);
      });

      const now = new Date();
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
      const overdueTasks = tasks.filter(task => 
        task.dueDate && task.dueDate < now && task.status !== 'completed'
      ).length;

      // Get project to check progress
      const project = await this.getProject(projectId);

      // Get team members count (simplified)
      let teamMembers = 0;
      if (project?.teamId) {
        const teamUsersRef = collection(db, 'teamUsers');
        const teamQuery = query(teamUsersRef, where('teamId', '==', project.teamId));
        const teamSnapshot = await getDocs(teamQuery);
        teamMembers = teamSnapshot.size;
      }

      return {
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalEpics: 0, // Simplified - no epics for now
        completedEpics: 0,
        progress: project?.progress || 0,
        teamMembers,
      };
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw new Error('Failed to get project statistics');
    }
  }

  /**
   * Search projects
   */
  static async searchProjects(workspaceId: string, searchTerm: string): Promise<Project[]> {
    try {
      const projects = await this.getWorkspaceProjects(workspaceId);
      
      return projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching projects:', error);
      throw new Error('Failed to search projects');
    }
  }

  /**
   * Get recent projects
   */
  static async getRecentProjects(workspaceId: string, limitCount: number = 5): Promise<Project[]> {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('workspaceId', '==', workspaceId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          startDate: data.startDate?.toDate(),
          dueDate: data.dueDate?.toDate(),
        } as Project);
      });

      return projects;
    } catch (error) {
      console.error('Error getting recent projects:', error);
      throw new Error('Failed to get recent projects');
    }
  }

  // ===============================
  // PROJECT RBAC METHODS
  // ===============================

  /**
   * Update project visibility
   */
  static async updateProjectVisibility(
    projectId: string, 
    visibility: 'public' | 'private' | 'restricted',
    updatedBy: string
  ): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        visibility,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        'project',
        projectId,
        {
          targetName: project.name,
          previousVisibility: project.visibility,
          newVisibility: visibility,
        },
        project.workspaceId,
        updatedBy
      );
    } catch (error) {
      console.error('Error updating project visibility:', error);
      throw new Error('Failed to update project visibility');
    }
  }

  /**
   * Add project admin
   */
  static async addProjectAdmin(projectId: string, userId: string, addedBy: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const currentAdmins = project.projectAdmins || [];
      if (currentAdmins.includes(userId)) {
        return; // User is already an admin
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        projectAdmins: [...currentAdmins, userId],
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        'project',
        projectId,
        {
          targetName: project.name,
          addedUserId: userId,
        },
        project.workspaceId,
        addedBy
      );
    } catch (error) {
      console.error('Error adding project admin:', error);
      throw new Error('Failed to add project admin');
    }
  }

  /**
   * Remove project admin
   */
  static async removeProjectAdmin(projectId: string, userId: string, removedBy: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const currentAdmins = project.projectAdmins || [];
      const updatedAdmins = currentAdmins.filter(id => id !== userId);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        projectAdmins: updatedAdmins,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        'project',
        projectId,
        {
          targetName: project.name,
          removedUserId: userId,
        },
        project.workspaceId,
        removedBy
      );
    } catch (error) {
      console.error('Error removing project admin:', error);
      throw new Error('Failed to remove project admin');
    }
  }

  /**
   * Add project member
   */
  static async addProjectMember(projectId: string, userId: string, addedBy: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const currentMembers = project.projectMembers || [];
      if (currentMembers.includes(userId)) {
        return; // User is already a member
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        projectMembers: [...currentMembers, userId],
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        'project',
        projectId,
        {
          targetName: project.name,
          addedUserId: userId,
        },
        project.workspaceId,
        addedBy
      );
    } catch (error) {
      console.error('Error adding project member:', error);
      throw new Error('Failed to add project member');
    }
  }

  /**
   * Remove project member
   */
  static async removeProjectMember(projectId: string, userId: string, removedBy: string): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const currentMembers = project.projectMembers || [];
      const updatedMembers = currentMembers.filter(id => id !== userId);

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        projectMembers: updatedMembers,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        'project',
        projectId,
        {
          targetName: project.name,
          removedUserId: userId,
        },
        project.workspaceId,
        removedBy
      );
    } catch (error) {
      console.error('Error removing project member:', error);
      throw new Error('Failed to remove project member');
    }
  }

  /**
   * Update project permissions
   */
  static async updateProjectPermissions(
    projectId: string,
    permissions: Partial<Project['permissions']>,
    updatedBy: string
  ): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const updatedPermissions = {
        ...project.permissions,
        ...permissions,
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        permissions: updatedPermissions,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        'project',
        projectId,
        {
          targetName: project.name,
          updatedPermissions: Object.keys(permissions),
        },
        project.workspaceId,
        updatedBy
      );
    } catch (error) {
      console.error('Error updating project permissions:', error);
      throw new Error('Failed to update project permissions');
    }
  }

  /**
   * Get projects accessible to a specific user
   */
  static async getAccessibleProjects(workspaceId: string, userId: string, userRole: string): Promise<Project[]> {
    try {
      const allProjects = await this.getWorkspaceProjects(workspaceId);
      
      return allProjects.filter(project => {
        // Owner and admin can see all projects
        if (userRole === 'owner' || userRole === 'admin') {
          return true;
        }

        // Project owner can see their projects
        if (project.ownerId === userId) {
          return true;
        }

        // Project admin can see the project
        if (project.projectAdmins?.includes(userId)) {
          return true;
        }

        // Project member can see the project
        if (project.projectMembers?.includes(userId)) {
          return true;
        }

        // Public projects are visible to all
        if (project.visibility === 'public') {
          return true;
        }

        // Check specific view permissions
        if (project.permissions?.canView?.includes(userId)) {
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Error getting accessible projects:', error);
      throw new Error('Failed to get accessible projects');
    }
  }

  /**
   * Private helper methods
   */
  private static async deleteProjectTasks(projectId: string): Promise<void> {
    try {
      const tasks = await this.getProjectTasks(projectId);
      const batch = writeBatch(db);

      tasks.forEach(task => {
        const taskRef = doc(db, 'tasks', task.id);
        batch.delete(taskRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting project tasks:', error);
    }
  }

  private static async deleteProjectEpics(projectId: string): Promise<void> {
    try {
      const epics = await this.getProjectEpics(projectId);
      const batch = writeBatch(db);

      epics.forEach(epic => {
        const epicRef = doc(db, 'epics', epic.id);
        batch.delete(epicRef);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting project epics:', error);
    }
  }
}
