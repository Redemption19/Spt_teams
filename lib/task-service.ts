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
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments'>, createdBy?: string): Promise<string> {
    try {
      const tasksRef = collection(db, 'tasks');
      
      const newTask = {
        ...taskData,
        comments: [],
        attachments: [],
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
      console.error('Error getting workspace tasks:', error);
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
} 