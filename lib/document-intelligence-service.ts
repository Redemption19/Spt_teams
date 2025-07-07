'use client';

import { TaskService } from './task-service';
import { TeamService } from './team-service';
import { ReportService } from './report-service';
import { WorkspaceService } from './workspace-service';
import { FolderService } from './folder-service';
import { UserService } from './user-service';
import { Task } from './types';

export interface DocumentAnalysis {
  id: string;
  title: string;
  type: 'report' | 'task' | 'project' | 'folder' | 'team' | 'department';
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  lastModified: Date;
  status: string;
  content: {
    summary: string;
    keyPoints: string[];
    wordCount: number;
    readingTime: number;
  };
  analysis: {
    completeness: number; // 0-100
    quality: number; // 0-100
    clarity: number; // 0-100
    compliance: number; // 0-100
  };
  improvements: {
    critical: string[];
    suggestions: string[];
    commendations: string[];
  };
  metadata: {
    tags: string[];
    categories: string[];
    complexity: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high';
  };
}

export interface UserActivity {
  userId: string;
  userName: string;
  userRole: string;
  todayActivity: {
    tasksCompleted: number;
    reportsSubmitted: number;
    projectsUpdated: number;
    teamInteractions: number;
  };
  recentSubmissions: DocumentAnalysis[];
}

export class DocumentIntelligenceService {
  /**
   * Analyze and summarize a document (report, task, etc.)
   */
  static async analyzeDocument(
    documentId: string,
    documentType: 'report' | 'task' | 'project' | 'folder' | 'team' | 'department',
    workspaceId: string,
    requesterId: string
  ): Promise<DocumentAnalysis | null> {
    try {
      let document: any = null;
      let author: any = null;

      // Fetch document based on type
      switch (documentType) {
        case 'report':
          const reports = await ReportService.getWorkspaceReports(workspaceId, { limit: 100 });
          document = reports.find(r => r.id === documentId);
          if (document) {
            author = await this.getDocumentAuthor(document.userId || document.authorId, workspaceId);
          }
          break;

        case 'task':
          const tasks = await TaskService.getWorkspaceTasks(workspaceId);
          document = tasks.find(t => t.id === documentId);
          if (document) {
            author = await this.getDocumentAuthor(document.assignedTo || document.createdBy, workspaceId);
          }
          break;

        case 'project':
          // Assuming projects are stored similarly to tasks or have their own service
          const projects = await TaskService.getWorkspaceTasks(workspaceId); // Adjust if you have ProjectService
          document = projects.find(p => p.id === documentId && (p as any).type === 'project');
          if (document) {
            author = await this.getDocumentAuthor(document.assignedTo || document.createdBy, workspaceId);
          }
          break;

        case 'team':
          const teams = await TeamService.getWorkspaceTeams(workspaceId);
          document = teams.find(t => t.id === documentId);
          if (document) {
            author = await this.getDocumentAuthor(document.createdBy || document.leadId, workspaceId);
          }
          break;

        default:
          return null;
      }

      if (!document) {
        return null;
      }

      // Generate intelligent analysis
      const analysis = await this.generateDocumentAnalysis(document, documentType, author);
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing document:', error);
      return null;
    }
  }

  /**
   * Get user activity summary for a specific date
   */
  static async getUserActivitySummary(
    userId: string,
    workspaceId: string,
    date: Date = new Date(),
    requesterId: string,
    requesterRole: string
  ): Promise<UserActivity | null> {
    try {
      // Check permissions
      if (requesterRole === 'member' && requesterId !== userId) {
        return null; // Members can only see their own activity
      }

      const user = await this.getDocumentAuthor(userId, workspaceId);
      if (!user) return null;

      // Get today's date range
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch user's activity
      const [tasks, reports, teams] = await Promise.all([
        TaskService.getUserAssignedTasks(userId, workspaceId),
        this.getUserReports(userId, workspaceId),
        TeamService.getUserTeams(userId, workspaceId)
      ]);

      // Filter today's activities
      const todayTasks = tasks.filter(t => {
        const taskDate = new Date(t.updatedAt || t.createdAt);
        return taskDate >= startOfDay && taskDate <= endOfDay && t.status === 'completed';
      });

      const todayReports = reports.filter(r => {
        const reportDate = new Date(r.createdAt || r.updatedAt);
        return reportDate >= startOfDay && reportDate <= endOfDay;
      });

      // Generate document analyses for recent submissions
      const recentSubmissions: DocumentAnalysis[] = [];
      
      // Analyze recent reports
      for (const report of todayReports.slice(0, 5)) {
        const analysis = await this.generateDocumentAnalysis(report, 'report', user);
        if (analysis) {
          recentSubmissions.push(analysis);
        }
      }

      // Analyze recent completed tasks
      for (const task of todayTasks.slice(0, 3)) {
        const analysis = await this.generateDocumentAnalysis(task, 'task', user);
        if (analysis) {
          recentSubmissions.push(analysis);
        }
      }

      return {
        userId,
        userName: user.name,
        userRole: user.role,
        todayActivity: {
          tasksCompleted: todayTasks.length,
          reportsSubmitted: todayReports.length,
          projectsUpdated: 0, // Can be expanded
          teamInteractions: teams.length
        },
        recentSubmissions
      };

    } catch (error) {
      console.error('❌ Error getting user activity summary:', error);
      return null;
    }
  }

  /**
   * Search for documents by user name and date
   */
  static async searchUserDocuments(
    userName: string,
    workspaceId: string,
    date?: Date,
    documentType?: string
  ): Promise<DocumentAnalysis[]> {
    try {
      const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);
      const user = workspaceUsers.find(u => 
        u.user.name.toLowerCase().includes(userName.toLowerCase()) ||
        u.user.email?.toLowerCase().includes(userName.toLowerCase())
      );

      if (!user) {
        return [];
      }

      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const documents: DocumentAnalysis[] = [];

      // Search reports
      if (!documentType || documentType === 'report') {
        const userReports = await this.getUserReports(user.user.id, workspaceId);
        const todayReports = userReports.filter(r => {
          const reportDate = new Date(r.createdAt || r.updatedAt);
          return reportDate >= startOfDay && reportDate <= endOfDay;
        });

        for (const report of todayReports) {
          const analysis = await this.generateDocumentAnalysis(report, 'report', user.user);
          if (analysis) {
            documents.push(analysis);
          }
        }
      }

      // Search tasks
      if (!documentType || documentType === 'task') {
        const userTasks = await TaskService.getUserAssignedTasks(user.user.id, workspaceId);
        const todayTasks = userTasks.filter(t => {
          const taskDate = new Date(t.updatedAt || t.createdAt);
          return taskDate >= startOfDay && taskDate <= endOfDay;
        });

        for (const task of todayTasks) {
          const analysis = await this.generateDocumentAnalysis(task, 'task', user.user);
          if (analysis) {
            documents.push(analysis);
          }
        }
      }

      return documents.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    } catch (error) {
      console.error('❌ Error searching user documents:', error);
      return [];
    }
  }

  /**
   * Generate intelligent document analysis
   */
  private static async generateDocumentAnalysis(
    document: any,
    type: 'report' | 'task' | 'project' | 'folder' | 'team' | 'department',
    author: any
  ): Promise<DocumentAnalysis> {
    const content = this.extractDocumentContent(document, type);
    const analysis = this.analyzeContentQuality(content, type);
    const improvements = this.generateImprovementSuggestions(document, type, analysis);
    const metadata = this.extractMetadata(document, type);

    return {
      id: document.id,
      title: document.title || document.name || 'Untitled',
      type,
      author: {
        id: author.id,
        name: author.name,
        role: author.role || 'member'
      },
      createdAt: new Date(document.createdAt || Date.now()),
      lastModified: new Date(document.updatedAt || document.createdAt || Date.now()),
      status: document.status || 'active',
      content,
      analysis,
      improvements,
      metadata
    };
  }

  /**
   * Extract meaningful content from document
   */
  private static extractDocumentContent(document: any, type: string): DocumentAnalysis['content'] {
    let text = '';
    let keyPoints: string[] = [];

    switch (type) {
      case 'report':
        text = [
          document.title || '',
          document.summary || '',
          document.description || '',
          document.content || '',
          document.findings || '',
          document.recommendations || ''
        ].filter(Boolean).join(' ');
        
        keyPoints = [
          document.summary ? `Summary: ${document.summary}` : '',
          document.findings ? `Findings: ${document.findings}` : '',
          document.recommendations ? `Recommendations: ${document.recommendations}` : '',
          document.status ? `Status: ${document.status}` : ''
        ].filter(Boolean);
        break;

      case 'task':
        text = [
          document.title || '',
          document.description || '',
          document.notes || '',
          document.comments || ''
        ].filter(Boolean).join(' ');
        
        keyPoints = [
          document.title ? `Task: ${document.title}` : '',
          document.priority ? `Priority: ${document.priority}` : '',
          document.status ? `Status: ${document.status}` : '',
          document.dueDate ? `Due: ${new Date(document.dueDate).toLocaleDateString()}` : ''
        ].filter(Boolean);
        break;

      case 'team':
        text = [
          document.name || '',
          document.description || '',
          document.objectives || ''
        ].filter(Boolean).join(' ');
        
        keyPoints = [
          document.name ? `Team: ${document.name}` : '',
          document.description ? `Description: ${document.description}` : '',
          document.memberCount ? `Members: ${document.memberCount}` : ''
        ].filter(Boolean);
        break;

      default:
        text = document.title || document.name || '';
        keyPoints = [text].filter(Boolean);
    }

    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    return {
      summary: this.generateSummary(text, keyPoints),
      keyPoints,
      wordCount,
      readingTime
    };
  }

  /**
   * Generate intelligent content summary
   */
  private static generateSummary(text: string, keyPoints: string[]): string {
    if (text.length < 50) {
      return text;
    }

    // Extract first few sentences or key information
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 2).join('. ').trim();
    
    if (summary.length > 200) {
      return summary.substring(0, 200) + '...';
    }

    return summary || keyPoints.join('. ');
  }

  /**
   * Analyze content quality
   */
  private static analyzeContentQuality(content: DocumentAnalysis['content'], type: string): DocumentAnalysis['analysis'] {
    const wordCount = content.wordCount;
    const keyPointsCount = content.keyPoints.length;
    const summaryLength = content.summary.length;

    // Base quality metrics
    let completeness = 0;
    let quality = 0;
    let clarity = 0;
    let compliance = 0;

    // Analyze based on document type
    switch (type) {
      case 'report':
        completeness = Math.min(100, (wordCount / 500) * 100); // Expect at least 500 words
        quality = Math.min(100, (keyPointsCount / 4) * 100); // Expect at least 4 key points
        clarity = Math.min(100, (summaryLength / 100) * 100); // Expect detailed summary
        compliance = keyPointsCount >= 3 ? 100 : (keyPointsCount / 3) * 100;
        break;

      case 'task':
        completeness = wordCount >= 20 ? 100 : (wordCount / 20) * 100;
        quality = keyPointsCount >= 3 ? 100 : (keyPointsCount / 3) * 100;
        clarity = summaryLength >= 30 ? 100 : (summaryLength / 30) * 100;
        compliance = keyPointsCount >= 2 ? 100 : (keyPointsCount / 2) * 100;
        break;

      default:
        completeness = Math.min(100, (wordCount / 100) * 100);
        quality = Math.min(100, (keyPointsCount / 2) * 100);
        clarity = Math.min(100, (summaryLength / 50) * 100);
        compliance = 100;
    }

    return {
      completeness: Math.round(completeness),
      quality: Math.round(quality),
      clarity: Math.round(clarity),
      compliance: Math.round(compliance)
    };
  }

  /**
   * Generate improvement suggestions
   */
  private static generateImprovementSuggestions(
    document: any,
    type: string,
    analysis: DocumentAnalysis['analysis']
  ): DocumentAnalysis['improvements'] {
    const critical: string[] = [];
    const suggestions: string[] = [];
    const commendations: string[] = [];

    // Critical issues
    if (analysis.completeness < 50) {
      critical.push('Document appears incomplete - consider adding more detailed content');
    }
    if (analysis.clarity < 50) {
      critical.push('Content clarity needs improvement - consider reorganizing information');
    }

    // Suggestions based on document type
    switch (type) {
      case 'report':
        if (analysis.quality < 70) {
          suggestions.push('Add more supporting evidence and detailed analysis');
          suggestions.push('Include clear recommendations or next steps');
        }
        if (!document.summary) {
          suggestions.push('Add an executive summary for better readability');
        }
        if (!document.findings) {
          suggestions.push('Include key findings section');
        }
        if (analysis.compliance < 80) {
          suggestions.push('Ensure all required sections are completed');
        }
        break;

      case 'task':
        if (!document.description || document.description.length < 20) {
          suggestions.push('Add more detailed task description');
        }
        if (!document.dueDate) {
          suggestions.push('Set a clear deadline for better planning');
        }
        if (!document.priority) {
          suggestions.push('Set task priority level');
        }
        if (document.status === 'todo') {
          suggestions.push('Update progress status as work progresses');
        }
        break;

      case 'team':
        if (!document.description) {
          suggestions.push('Add team description and objectives');
        }
        if (!document.memberCount || document.memberCount < 2) {
          suggestions.push('Consider adding more team members for better collaboration');
        }
        break;
    }

    // Commendations
    if (analysis.completeness >= 80) {
      commendations.push('Well-structured and comprehensive content');
    }
    if (analysis.quality >= 80) {
      commendations.push('High-quality information and good attention to detail');
    }
    if (analysis.clarity >= 80) {
      commendations.push('Clear and easy to understand presentation');
    }

    return {
      critical,
      suggestions,
      commendations
    };
  }

  /**
   * Extract document metadata
   */
  private static extractMetadata(document: any, type: string): DocumentAnalysis['metadata'] {
    const tags: string[] = [];
    const categories: string[] = [];

    // Extract tags and categories based on document type
    if (document.tags) {
      tags.push(...document.tags);
    }
    if (document.category) {
      categories.push(document.category);
    }
    if (document.department) {
      categories.push(document.department);
    }
    if (document.priority) {
      tags.push(`priority-${document.priority}`);
    }
    if (document.status) {
      tags.push(`status-${document.status}`);
    }

    // Determine complexity
    const wordCount = document.description?.length || document.content?.length || 0;
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    if (wordCount > 1000) {
      complexity = 'high';
    } else if (wordCount > 300) {
      complexity = 'medium';
    }

    // Determine priority
    const priority = document.priority || 
      (document.status === 'urgent' ? 'high' : 
       document.status === 'important' ? 'medium' : 'low');

    return {
      tags,
      categories,
      complexity,
      priority: priority as 'low' | 'medium' | 'high'
    };
  }

  /**
   * Get document author information
   */
  private static async getDocumentAuthor(userId: string, workspaceId: string): Promise<any> {
    try {
      const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspaceId);
      const userInfo = workspaceUsers.find(wu => wu.user.id === userId);
      return userInfo ? {
        id: userInfo.user.id,
        name: userInfo.user.name,
        role: userInfo.role,
        email: userInfo.user.email
      } : null;
    } catch (error) {
      console.error('❌ Error getting author info:', error);
      return null;
    }
  }

  /**
   * Get user reports (helper method)
   */
  private static async getUserReports(userId: string, workspaceId: string): Promise<any[]> {
    try {
      // First try to get user-specific reports
      const userReports = await ReportService.getUserReports(workspaceId, userId, { limit: 100 });
      return userReports;
    } catch (error) {
      // Fallback to workspace reports and filter by user
      try {
        const allReports = await ReportService.getWorkspaceReports(workspaceId, { limit: 100 });
        return allReports.filter(r => r.authorId === userId || (r as any).createdBy === userId);
      } catch (fallbackError) {
        console.error('❌ Error getting user reports:', fallbackError);
        return [];
      }
    }
  }
}
