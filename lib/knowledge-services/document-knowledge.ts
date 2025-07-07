'use client';

import { DocumentIntelligenceService, DocumentAnalysis, UserActivity } from '../document-intelligence-service';
import { WorkspaceService } from '../workspace-service';
import { KnowledgeContext } from '../ai-knowledge-service';

export class DocumentKnowledgeService {
  /**
   * Check if query is asking for document analysis
   */
  static isDocumentAnalysisQuery(query: string): boolean {
    const analysisKeywords = [
      'summary', 'summarize', 'analyze', 'analysis', 'review', 'report',
      'document', 'submitted', 'completed', 'improvement', 'feedback',
      'quality', 'what did', 'show me', 'give me summary'
    ];
    return analysisKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Analyze and summarize documents with intelligent insights
   */
  static async getDocumentAnalysis(
    query: string,
    context: KnowledgeContext
  ): Promise<string> {
    const { workspace, user } = context;
    const lowerQuery = query.toLowerCase();
    
    try {
      let analysisResults = '\nDOCUMENT ANALYSIS:\n';
      
      // Extract user name and document type from query
      const userNameMatch = this.extractUserName(lowerQuery);
      const documentType = this.extractDocumentType(lowerQuery);
      const timeFrame = this.extractTimeFrame(lowerQuery);
      
      if (userNameMatch) {
        // Search for specific user's documents
        const documents = await DocumentIntelligenceService.searchUserDocuments(
          userNameMatch,
          workspace.id,
          timeFrame,
          documentType
        );
        
        if (documents.length > 0) {
          analysisResults += `Found ${documents.length} document(s) by ${userNameMatch}:\n\n`;
          
          for (const doc of documents.slice(0, 3)) { // Limit to 3 most recent
            analysisResults += this.formatDocumentAnalysis(doc);
          }
        } else {
          analysisResults += `No documents found by "${userNameMatch}" for the specified criteria.\n`;
        }
      } else {
        // Get user's own activity summary
        const userActivity = await DocumentIntelligenceService.getUserActivitySummary(
          user.id,
          workspace.id,
          timeFrame || new Date(),
          user.id,
          user.role
        );
        
        if (userActivity && userActivity.recentSubmissions.length > 0) {
          analysisResults += `Your recent document activity:\n\n`;
          
          for (const doc of userActivity.recentSubmissions.slice(0, 3)) {
            analysisResults += this.formatDocumentAnalysis(doc);
          }
        } else {
          analysisResults += 'No recent document activity found.\n';
        }
      }
      
      return analysisResults;
    } catch (error) {
      console.error('❌ Error getting document analysis:', error);
      return '\nDOCUMENT ANALYSIS: Unable to analyze documents.\n';
    }
  }

  /**
   * Get specific document analysis by ID
   */
  static async analyzeSpecificDocument(
    documentId: string,
    documentType: 'report' | 'task' | 'project' | 'folder' | 'team' | 'department',
    context: KnowledgeContext
  ): Promise<string> {
    const { workspace, user } = context;
    
    try {
      const analysis = await DocumentIntelligenceService.analyzeDocument(
        documentId,
        documentType,
        workspace.id,
        user.id
      );
      
      if (!analysis) {
        return '\nDOCUMENT ANALYSIS: Document not found or access denied.\n';
      }
      
      return `\nDETAILED DOCUMENT ANALYSIS:\n${this.formatDocumentAnalysis(analysis, true)}`;
    } catch (error) {
      console.error('❌ Error analyzing specific document:', error);
      return '\nDOCUMENT ANALYSIS: Unable to analyze document.\n';
    }
  }

  /**
   * Get team document insights
   */
  static async getTeamDocumentInsights(context: KnowledgeContext): Promise<string> {
    const { workspace, user } = context;
    
    try {
      // Only admins and owners can see team insights
      if (user.role === 'member') {
        return '\nTEAM DOCUMENT INSIGHTS: Access restricted to admins and owners.\n';
      }
      
      let insights = '\nTEAM DOCUMENT INSIGHTS:\n';
      
      // Get workspace users
      const workspaceUsers = await WorkspaceService.getWorkspaceUsers(workspace.id);
      const todayActivities: UserActivity[] = [];
      
      // Get activity for each user (limit to prevent overload)
      for (const workspaceUser of workspaceUsers.slice(0, 10)) {
        const activity = await DocumentIntelligenceService.getUserActivitySummary(
          workspaceUser.user.id,
          workspace.id,
          new Date(),
          user.id,
          user.role
        );
        
        if (activity) {
          todayActivities.push(activity);
        }
      }
      
      // Summarize team activity
      const totalTasksCompleted = todayActivities.reduce((sum, a) => sum + a.todayActivity.tasksCompleted, 0);
      const totalReportsSubmitted = todayActivities.reduce((sum, a) => sum + a.todayActivity.reportsSubmitted, 0);
      const activeUsers = todayActivities.filter(a => 
        a.todayActivity.tasksCompleted > 0 || a.todayActivity.reportsSubmitted > 0
      ).length;
      
      insights += `Today's Team Activity:
- Active users: ${activeUsers}/${workspaceUsers.length}
- Tasks completed: ${totalTasksCompleted}
- Reports submitted: ${totalReportsSubmitted}

Recent Submissions:\n`;
      
      // Show recent high-quality submissions
      const allSubmissions = todayActivities
        .flatMap(a => a.recentSubmissions)
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
        .slice(0, 5);
      
      for (const submission of allSubmissions) {
        insights += `\n• ${submission.author.name} - ${submission.title}
  Quality Score: ${Math.round((submission.analysis.completeness + submission.analysis.quality + submission.analysis.clarity) / 3)}%
  ${submission.improvements.commendations.length > 0 ? '✓ ' + submission.improvements.commendations[0] : ''}
`;
      }
      
      return insights;
    } catch (error) {
      console.error('❌ Error getting team document insights:', error);
      return '\nTEAM DOCUMENT INSIGHTS: Unable to fetch team insights.\n';
    }
  }

  /**
   * Format document analysis for display
   */
  private static formatDocumentAnalysis(doc: DocumentAnalysis, detailed: boolean = false): string {
    const qualityScore = Math.round((doc.analysis.completeness + doc.analysis.quality + doc.analysis.clarity + doc.analysis.compliance) / 4);
    
    let result = `📄 ${doc.title} (${doc.type.toUpperCase()})
👤 Author: ${doc.author.name} (${doc.author.role})
📅 ${doc.lastModified.toLocaleDateString()} • ${doc.content.wordCount} words • ${doc.content.readingTime} min read
📊 Quality Score: ${qualityScore}% (Completeness: ${doc.analysis.completeness}%, Quality: ${doc.analysis.quality}%, Clarity: ${doc.analysis.clarity}%)

📝 Summary: ${doc.content.summary}

`;

    if (detailed) {
      result += `Key Points:
${doc.content.keyPoints.map(point => `• ${point}`).join('\n')}

`;
    }

    // Add improvements
    if (doc.improvements.critical.length > 0) {
      result += `🚨 Critical Issues:
${doc.improvements.critical.map(issue => `• ${issue}`).join('\n')}

`;
    }

    if (doc.improvements.suggestions.length > 0) {
      result += `💡 Suggestions for Improvement:
${doc.improvements.suggestions.map(suggestion => `• ${suggestion}`).join('\n')}

`;
    }

    if (doc.improvements.commendations.length > 0) {
      result += `✅ Commendations:
${doc.improvements.commendations.map(commendation => `• ${commendation}`).join('\n')}

`;
    }

    return result + '\n';
  }

  /**
   * Extract user name from query
   */
  private static extractUserName(query: string): string | null {
    // Look for patterns like "benjamin", "john doe", etc.
    const namePatterns = [
      /(?:report|task|document).*?(?:by|from|submitted by|created by)\s+([a-zA-Z\s]+)(?:\s|$)/i,
      /(?:what|show).*?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:submit|create|complete)/i,
      /([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:submit|complete|create)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Filter out common words
        const commonWords = ['report', 'task', 'document', 'today', 'yesterday', 'this', 'what', 'show', 'me'];
        if (!commonWords.includes(name.toLowerCase()) && name.length > 2) {
          return name;
        }
      }
    }
    
    return null;
  }

  /**
   * Extract document type from query
   */
  private static extractDocumentType(query: string): string | undefined {
    const types = ['report', 'task', 'project', 'folder', 'team', 'department'];
    
    for (const type of types) {
      if (query.includes(type)) {
        return type;
      }
    }
    
    return undefined;
  }

  /**
   * Extract time frame from query
   */
  private static extractTimeFrame(query: string): Date | undefined {
    const today = new Date();
    
    if (query.includes('today')) {
      return today;
    }
    
    if (query.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    if (query.includes('this week')) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return weekStart;
    }
    
    return today; // Default to today
  }
}
