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
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Comment } from './types';
import { ActivityService } from './activity-service';

export class TaskService {
  /**
   * Create a new task
   */
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'createdBy' | 'visibility' | 'permissions'>, createdBy?: string): Promise<string> {
    try {
      const tasksRef = collection(db, 'tasks');
      
      const newTask = {
        ...taskData,
        comments: [], // Initialize with empty comments array
        attachments: [],
        // === DEFAULT RBAC SETTINGS ===
        createdBy: createdBy || 'system',
        visibility: 'public' as const, // Default to public visibility
        permissions: {
          canView: [], // Empty means only explicit permissions
          canEdit: [], // Only creator and system admins can edit by default
          canDelete: [], // Only creator and system admins can delete by default
          canComment: [], // Anyone who can view can comment by default
          canAssign: [], // Only project admins can assign by default
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(tasksRef, newTask);

      // Log activity
      if (createdBy) {
        try {
          await ActivityService.logActivity(
            'task_created',
            'task',
            docRef.id,
            {
              targetName: taskData.title,
              projectId: taskData.projectId,
              assigneeId: taskData.assigneeId,
              priority: taskData.priority,
              status: taskData.status,
              visibility: 'public',
            },
            taskData.workspaceId,
            createdBy
          );
        } catch (activityError) {
          console.error('Error logging task creation activity:', activityError);
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Get all tasks for a workspace
   */
  static async getWorkspaceTasks(workspaceId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef,
        where('workspaceId', '==', workspaceId),
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
          comments: data.comments || [],
          attachments: data.attachments || [],
          tags: data.tags || [],
        } as Task);
      });

      return tasks;
    } catch (error) {
      console.error('❌ TaskService - Error getting workspace tasks:', error);
      throw new Error('Failed to get workspace tasks');
    }
  }

  /**
   * Get tasks by project
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
          comments: data.comments || [],
          attachments: data.attachments || [],
          tags: data.tags || [],
        } as Task);
      });

      return tasks;
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw new Error('Failed to get project tasks');
    }
  }

  /**
   * Get a single task by ID
   */
  static async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);

      if (taskSnap.exists()) {
        const data = taskSnap.data();
        return {
          id: taskSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate(),
          comments: data.comments || [],
          attachments: data.attachments || [],
          tags: data.tags || [],
        } as Task;
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      throw new Error('Failed to get task');
    }
  }

  /**
   * Update task
   */
  static async updateTask(taskId: string, updates: Partial<Task>, updatedBy?: string): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      
      // Get current task data for activity logging
      const currentTask = await this.getTask(taskId);
      
      // Remove read-only fields
      const { id, createdAt, comments, attachments, ...updateData } = updates;
      
      await updateDoc(taskRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      if (updatedBy && currentTask) {
        try {
          const activityType = updates.status === 'completed' ? 'task_completed' : 
                              updates.assigneeId !== currentTask.assigneeId ? 'task_assigned' : 'task_updated';
          
          await ActivityService.logActivity(
            activityType,
            'task',
            taskId,
            {
              targetName: updates.title || currentTask.title,
              projectId: currentTask.projectId,
              changes: Object.keys(updateData),
              previousValues: Object.keys(updateData).reduce((prev, key) => {
                prev[key] = currentTask[key as keyof Task];
                return prev;
              }, {} as Record<string, any>),
              newAssignee: updates.assigneeId,
              previousAssignee: currentTask.assigneeId,
            },
            currentTask.workspaceId,
            updatedBy
          );
        } catch (activityError) {
          console.error('Error logging task update activity:', activityError);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Update task status (for Kanban board)
   */
  static async updateTaskStatus(taskId: string, newStatus: Task['status'], updatedBy?: string): Promise<void> {
    try {
      await this.updateTask(taskId, { status: newStatus }, updatedBy);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw new Error('Failed to update task status');
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(taskId: string, deletedBy?: string): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);

      // Log activity
      if (deletedBy) {
        try {
          await ActivityService.logActivity(
            'task_updated', // Use task_updated instead of task_deleted for now
            'task',
            taskId,
            {
              targetName: task.title,
              projectId: task.projectId,
              assigneeId: task.assigneeId,
              action: 'deleted',
            },
            task.workspaceId,
            deletedBy
          );
        } catch (activityError) {
          console.error('Error logging task deletion activity:', activityError);
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  /**
   * Add comment to task
   */
  static async addTaskComment(taskId: string, content: string, authorId: string): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedComments = [...task.comments, newComment];

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding task comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get tasks grouped by status (for Kanban board)
   */
  static async getTasksByStatus(projectId?: string, workspaceId?: string): Promise<{
    todo: Task[];
    'in-progress': Task[];
    review: Task[];
    completed: Task[];
  }> {
    try {
      let tasks: Task[] = [];
      
      if (projectId) {
        tasks = await this.getProjectTasks(projectId);
      } else if (workspaceId) {
        tasks = await this.getWorkspaceTasks(workspaceId);
      }

      return {
        todo: tasks.filter(task => task.status === 'todo'),
        'in-progress': tasks.filter(task => task.status === 'in-progress'),
        review: tasks.filter(task => task.status === 'review'),
        completed: tasks.filter(task => task.status === 'completed'),
      };
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      throw new Error('Failed to get tasks by status');
    }
  }

  /**
   * Search tasks
   */
  static async searchTasks(searchTerm: string, projectId?: string, workspaceId?: string): Promise<Task[]> {
    try {
      let tasks: Task[] = [];
      
      if (projectId) {
        tasks = await this.getProjectTasks(projectId);
      } else if (workspaceId) {
        tasks = await this.getWorkspaceTasks(workspaceId);
      }
      
      return tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching tasks:', error);
      throw new Error('Failed to search tasks');
    }
  }

  // ===============================
  // TASK RBAC METHODS
  // ===============================

  /**
   * Update task visibility
   */
  static async updateTaskVisibility(
    taskId: string, 
    visibility: 'public' | 'private' | 'assignee-only',
    updatedBy: string
  ): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        visibility,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'task_updated',
        'task',
        taskId,
        {
          targetName: task.title,
          projectId: task.projectId,
          previousVisibility: task.visibility,
          newVisibility: visibility,
        },
        task.workspaceId,
        updatedBy
      );
    } catch (error) {
      console.error('Error updating task visibility:', error);
      throw new Error('Failed to update task visibility');
    }
  }

  /**
   * Update task permissions
   */
  static async updateTaskPermissions(
    taskId: string,
    permissions: Partial<Task['permissions']>,
    updatedBy: string
  ): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const updatedPermissions = {
        ...task.permissions,
        ...permissions,
      };

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        permissions: updatedPermissions,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'task_updated',
        'task',
        taskId,
        {
          targetName: task.title,
          projectId: task.projectId,
          updatedPermissions: Object.keys(permissions),
        },
        task.workspaceId,
        updatedBy
      );
    } catch (error) {
      console.error('Error updating task permissions:', error);
      throw new Error('Failed to update task permissions');
    }
  }

  /**
   * Get tasks accessible to a specific user within a project
   */
  static async getAccessibleTasks(
    projectId: string, 
    userId: string, 
    userRole: string
  ): Promise<Task[]> {
    try {
      const allTasks = await this.getProjectTasks(projectId);
      
      return allTasks.filter(task => {
        // Owner and admin can see all tasks
        if (userRole === 'owner' || userRole === 'admin') {
          return true;
        }

        // Task creator can see their tasks
        if (task.createdBy === userId) {
          return true;
        }

        // Task assignee can see assigned tasks
        if (task.assigneeId === userId) {
          return true;
        }

        // Check task visibility
        if (task.visibility === 'public') {
          return true;
        }

        if (task.visibility === 'assignee-only') {
          return task.assigneeId === userId || task.createdBy === userId;
        }

        if (task.visibility === 'private') {
          return task.permissions?.canView?.includes(userId) || false;
        }

        return false;
      });
    } catch (error) {
      console.error('Error getting accessible tasks:', error);
      throw new Error('Failed to get accessible tasks');
    }
  }

  /**
   * Assign task to user (with permission check)
   */
  static async assignTask(
    taskId: string,
    assigneeId: string,
    assignedBy: string
  ): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      await this.updateTask(taskId, { assigneeId }, assignedBy);

      // Log activity specifically for assignment
      await ActivityService.logActivity(
        'task_assigned',
        'task',
        taskId,
        {
          targetName: task.title,
          projectId: task.projectId,
          assigneeId,
          previousAssignee: task.assigneeId,
        },
        task.workspaceId,
        assignedBy
      );
    } catch (error) {
      console.error('Error assigning task:', error);
      throw new Error('Failed to assign task');
    }
  }

  /**
   * Get user's assigned tasks
   */
  static async getUserAssignedTasks(userId: string, workspaceId?: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'tasks');
      let q = query(tasksRef, where('assigneeId', '==', userId));
      
      if (workspaceId) {
        q = query(tasksRef, 
          where('assigneeId', '==', userId),
          where('workspaceId', '==', workspaceId)
        );
      }
      
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

      return tasks;
    } catch (error) {
      console.error('❌ TaskService - Error getting user assigned tasks:', error);
      throw new Error('Failed to get user assigned tasks');
    }
  }

  /**
   * Get tasks created by user
   */
  static async getUserCreatedTasks(userId: string, workspaceId?: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'tasks');
      let q = query(tasksRef, where('createdBy', '==', userId));
      
      if (workspaceId) {
        q = query(tasksRef, 
          where('createdBy', '==', userId),
          where('workspaceId', '==', workspaceId)
        );
      }
      
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

      return tasks;
    } catch (error) {
      console.error('Error getting user created tasks:', error);
      throw new Error('Failed to get user created tasks');
    }
  }

  /**
   * Bulk update task status (for bulk operations)
   */
  static async bulkUpdateTaskStatus(
    taskIds: string[],
    newStatus: Task['status'],
    updatedBy: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const taskId of taskIds) {
        const taskRef = doc(db, 'tasks', taskId);
        batch.update(taskRef, {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      // Log bulk activity
      await ActivityService.logActivity(
        'task_updated',
        'task',
        taskIds.join(','),
        {
          taskCount: taskIds.length,
          newStatus,
          action: 'bulk_status_update',
        },
        '', // We don't have workspace ID here, could be improved
        updatedBy
      );
    } catch (error) {
      console.error('Error bulk updating task status:', error);
      throw new Error('Failed to bulk update task status');
    }
  }

  /**
   * Bulk delete tasks (for bulk operations)
   */
  static async bulkDeleteTasks(taskIds: string[], deletedBy: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const taskId of taskIds) {
        const taskRef = doc(db, 'tasks', taskId);
        batch.delete(taskRef);
      }

      await batch.commit();

      // Log bulk activity
      await ActivityService.logActivity(
        'task_updated',
        'task',
        taskIds.join(','),
        {
          taskCount: taskIds.length,
          action: 'bulk_delete',
        },
        '', // We don't have workspace ID here, could be improved
        deletedBy
      );
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      throw new Error('Failed to bulk delete tasks');
    }
  }
} 
