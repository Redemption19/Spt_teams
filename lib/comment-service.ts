'use client';

import { 
  doc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment, Project, Task, User } from './types';
import { ActivityService } from './activity-service';

export class CommentService {
  /**
   * Add comment to a project
   */
  static async addProjectComment(
    projectId: string,
    content: string,
    authorId: string,
    authorName?: string,
    authorRole?: string
  ): Promise<Comment> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        authorId,
        authorName,
        authorRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        mentions: this.extractMentions(content),
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_comment_added',
        'project',
        projectId,
        {
          targetName: project.name,
          commentId: newComment.id,
          commentAuthor: authorName || authorId,
          commentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        },
        project.workspaceId,
        authorId
      );

      return newComment;
    } catch (error) {
      console.error('Error adding project comment:', error);
      throw new Error('Failed to add comment to project');
    }
  }

  /**
   * Add comment to a task
   */
  static async addTaskComment(
    taskId: string,
    content: string,
    authorId: string,
    authorName?: string,
    authorRole?: string
  ): Promise<Comment> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        authorId,
        authorName,
        authorRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        mentions: this.extractMentions(content),
      };

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'task_comment_added',
        'task',
        taskId,
        {
          targetName: task.title,
          projectId: task.projectId,
          commentId: newComment.id,
          commentAuthor: authorName || authorId,
          commentPreview: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        },
        task.workspaceId,
        authorId
      );

      return newComment;
    } catch (error) {
      console.error('Error adding task comment:', error);
      throw new Error('Failed to add comment to task');
    }
  }

  /**
   * Edit a project comment
   */
  static async editProjectComment(
    projectId: string,
    commentId: string,
    newContent: string,
    editorId: string
  ): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const commentIndex = project.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }

      const updatedComments = [...project.comments];
      updatedComments[commentIndex] = {
        ...updatedComments[commentIndex],
        content: newContent.trim(),
        updatedAt: new Date(),
        isEdited: true,
        editedAt: new Date(),
      };

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_comment_edited',
        'project',
        projectId,
        {
          targetName: project.name,
          commentId,
          editorName: editorId,
        },
        project.workspaceId,
        editorId
      );
    } catch (error) {
      console.error('Error editing project comment:', error);
      throw new Error('Failed to edit comment');
    }
  }

  /**
   * Edit a task comment
   */
  static async editTaskComment(
    taskId: string,
    commentId: string,
    newContent: string,
    editorId: string
  ): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const commentIndex = task.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }

      const updatedComments = [...task.comments];
      updatedComments[commentIndex] = {
        ...updatedComments[commentIndex],
        content: newContent.trim(),
        updatedAt: new Date(),
        isEdited: true,
        editedAt: new Date(),
      };

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'task_comment_edited',
        'task',
        taskId,
        {
          targetName: task.title,
          projectId: task.projectId,
          commentId,
          editorName: editorId,
        },
        task.workspaceId,
        editorId
      );
    } catch (error) {
      console.error('Error editing task comment:', error);
      throw new Error('Failed to edit comment');
    }
  }

  /**
   * Delete a project comment
   */
  static async deleteProjectComment(
    projectId: string,
    commentId: string,
    deleterId: string
  ): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const commentToDelete = project.comments.find(c => c.id === commentId);
      if (!commentToDelete) {
        throw new Error('Comment not found');
      }

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        comments: arrayRemove(commentToDelete),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'project_comment_deleted',
        'project',
        projectId,
        {
          targetName: project.name,
          commentId,
          deletedBy: deleterId,
          originalAuthor: commentToDelete.authorName || commentToDelete.authorId,
        },
        project.workspaceId,
        deleterId
      );
    } catch (error) {
      console.error('Error deleting project comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Delete a task comment
   */
  static async deleteTaskComment(
    taskId: string,
    commentId: string,
    deleterId: string
  ): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const commentToDelete = task.comments.find(c => c.id === commentId);
      if (!commentToDelete) {
        throw new Error('Comment not found');
      }

      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        comments: arrayRemove(commentToDelete),
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await ActivityService.logActivity(
        'task_comment_deleted',
        'task',
        taskId,
        {
          targetName: task.title,
          projectId: task.projectId,
          commentId,
          deletedBy: deleterId,
          originalAuthor: commentToDelete.authorName || commentToDelete.authorId,
        },
        task.workspaceId,
        deleterId
      );
    } catch (error) {
      console.error('Error deleting task comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Check if user can comment on a project
   */
  static canCommentOnProject(project: Project, userId: string, userRole: string): boolean {
    // Owner and admin can comment on all projects
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Project owner can comment
    if (project.ownerId === userId) {
      return true;
    }

    // Project admin can comment
    if (project.projectAdmins?.includes(userId)) {
      return true;
    }

    // Project member can comment
    if (project.projectMembers?.includes(userId)) {
      return true;
    }

    // Public projects allow comments from anyone who can view
    if (project.visibility === 'public') {
      return true;
    }

    // Check specific view permissions
    if (project.permissions?.canView?.includes(userId)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can comment on a task
   */
  static canCommentOnTask(task: Task, project: Project, userId: string, userRole: string): boolean {
    // Owner and admin can comment on all tasks
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Task creator can comment
    if (task.createdBy === userId) {
      return true;
    }

    // Task assignee can comment
    if (task.assigneeId === userId) {
      return true;
    }

    // Check if user can comment on the parent project
    if (this.canCommentOnProject(project, userId, userRole)) {
      return true;
    }

    // Check task-specific comment permissions
    if (task.permissions?.canComment?.includes(userId)) {
      return true;
    }

    return false;
  }

  /**
   * Check if user can edit a comment
   */
  static canEditComment(comment: Comment, userId: string, userRole: string): boolean {
    // Comment author can edit their own comments
    if (comment.authorId === userId) {
      return true;
    }

    // Owner can edit any comment
    if (userRole === 'owner') {
      return true;
    }

    // Admin can edit comments in their managed projects (context needed)
    if (userRole === 'admin') {
      return true;
    }

    return false;
  }

  /**
   * Check if user can delete a comment
   */
  static canDeleteComment(comment: Comment, userId: string, userRole: string): boolean {
    // Comment author can delete their own comments
    if (comment.authorId === userId) {
      return true;
    }

    // Owner can delete any comment
    if (userRole === 'owner') {
      return true;
    }

    // Admin can delete comments in their managed projects (context needed)
    if (userRole === 'admin') {
      return true;
    }

    return false;
  }

  /**
   * Add computed permission fields to comments
   */
  static addCommentPermissions(
    comments: Comment[], 
    userId: string, 
    userRole: string
  ): Comment[] {
    return comments.map(comment => ({
      ...comment,
      canEdit: this.canEditComment(comment, userId, userRole),
      canDelete: this.canDeleteComment(comment, userId, userRole),
    }));
  }

  /**
   * Extract mentions from comment content (@username)
   */
  private static extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Helper method to get project
   */
  private static async getProject(projectId: string): Promise<Project | null> {
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
          comments: data.comments || [],
        } as Project;
      }
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  /**
   * Helper method to get task
   */
  private static async getTask(taskId: string): Promise<Task | null> {
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
        } as Task;
      }
      return null;
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  }
} 