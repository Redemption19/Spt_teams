'use client';

import { StaticKnowledgeService } from './static-knowledge-service';
import { AnalyticsKnowledgeService } from './knowledge-services/analytics-knowledge';
import { CalendarKnowledgeService } from './knowledge-services/calendar-knowledge';
import { SuggestionKnowledgeService } from './knowledge-services/suggestion-knowledge';
import { EntityKnowledgeService } from './knowledge-services/entity-knowledge';
import { DocumentKnowledgeService } from './knowledge-services/document-knowledge';
import { HelpKnowledgeService } from './knowledge-services/help-knowledge';

export interface KnowledgeContext {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    role: string;
  };
  query: string;
}

export class AIKnowledgeService {
  /**
   * Get dynamic data based on user query and context with static knowledge
   */
  static async getContextualData(context: KnowledgeContext): Promise<string> {
    const { workspace, user, query } = context;
    const lowerQuery = query.toLowerCase();
    
    try {
      let contextData = '';

      // First, check for static knowledge
      const staticKnowledge = StaticKnowledgeService.searchKnowledge(query);
      if (staticKnowledge) {
        contextData += `\nSTATIC KNOWLEDGE:\n${staticKnowledge}\n`;
      }

      // Then add dynamic data based on query intent
      if (EntityKnowledgeService.isTaskRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getTaskContext(workspace.id, user.id, user.role);
      }

      if (EntityKnowledgeService.isTeamRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getTeamContext(workspace.id, user.id);
      }

      if (EntityKnowledgeService.isReportRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getReportContext(workspace.id, user.id, user.role);
      }

      if (EntityKnowledgeService.isUserRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getUserContext(workspace.id, user.role, user.id);
      }

      if (EntityKnowledgeService.isWorkspaceRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getWorkspaceContext(workspace.id, user.role, user.id);
      }

      // Check for folder-related queries
      if (EntityKnowledgeService.isFolderRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getFolderContext(workspace.id, user.id, user.role);
      }

      // Check for project-related queries
      if (EntityKnowledgeService.isProjectRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getProjectContext(workspace.id, user.id, user.role);
      }

      // Check for branch-related queries
      if (EntityKnowledgeService.isBranchRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getBranchContext(workspace.id, user.id, user.role);
      }

      // Check for region-related queries
      if (EntityKnowledgeService.isRegionRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getRegionContext(workspace.id, user.id, user.role);
        
        // Check for specific regional manager queries
        if (lowerQuery.includes('manager') || lowerQuery.includes('admin')) {
          contextData += await EntityKnowledgeService.getRegionalManagerDetails(context);
        }
      }

      // Check for department-related queries
      if (EntityKnowledgeService.isDepartmentRelated(lowerQuery)) {
        contextData += await EntityKnowledgeService.getDepartmentContext(workspace.id, user.id, user.role);
      }

      // Add analytics and predictive insights
      if (AnalyticsKnowledgeService.isAnalyticsRelated(lowerQuery)) {
        contextData += await AnalyticsKnowledgeService.getPerformanceAnalytics(context);
        contextData += await AnalyticsKnowledgeService.getResourceUtilization(context);
      }

      if (AnalyticsKnowledgeService.isPredictiveQuery(lowerQuery)) {
        contextData += await AnalyticsKnowledgeService.getPredictiveInsights(context);
      }

      // Add calendar and scheduling insights
      if (CalendarKnowledgeService.isCalendarRelated(lowerQuery)) {
        contextData += await CalendarKnowledgeService.getCalendarInsights(context);
      }

      // Add notification summary
      if (CalendarKnowledgeService.isNotificationRelated(lowerQuery)) {
        contextData += await CalendarKnowledgeService.getNotificationSummary(context);
      }

      // Add smart suggestions
      if (SuggestionKnowledgeService.isSuggestionQuery(lowerQuery)) {
        contextData += await SuggestionKnowledgeService.getSmartSuggestions(context);
      }

      // Add document analysis and intelligence
      if (DocumentKnowledgeService.isDocumentAnalysisQuery(lowerQuery)) {
        contextData += await DocumentKnowledgeService.getDocumentAnalysis(query, context);
      }

      // Add team document insights for admins/owners
      if ((user.role === 'admin' || user.role === 'owner') && 
          (lowerQuery.includes('team') || lowerQuery.includes('overview'))) {
        contextData += await DocumentKnowledgeService.getTeamDocumentInsights(context);
      }

      // Check for help requests with enhanced contextual help
      if (HelpKnowledgeService.isHelpRequest(lowerQuery)) {
        contextData += HelpKnowledgeService.getHelpContext(query, user.role);
      }

      // If no meaningful data found, add workspace suggestions
      if (contextData.length < 200) { // Arbitrary threshold for "meaningful" data
        const suggestions = await SuggestionKnowledgeService.getWorkspaceSuggestions(user.id, workspace.id);
        contextData += suggestions;
      }
      
      return contextData;
    } catch (error) {
      console.error('❌ Error fetching contextual data:', error);
      return '';
    }
  }

  /**
   * Get comprehensive context for complex queries
   */
  static async getComprehensiveContext(context: KnowledgeContext): Promise<string> {
    return EntityKnowledgeService.getComprehensiveContext(context);
  }

  /**
   * Get specific entity data by ID or name
   */
  static async getSpecificEntityData(entityType: string, identifier: string, context: KnowledgeContext): Promise<string> {
    return EntityKnowledgeService.getSpecificEntityData(entityType, identifier, context);
  }

  /**
   * Analyze specific document by ID
   */
  static async analyzeSpecificDocument(
    documentId: string,
    documentType: 'report' | 'task' | 'project' | 'folder' | 'team' | 'department',
    context: KnowledgeContext
  ): Promise<string> {
    return DocumentKnowledgeService.analyzeSpecificDocument(documentId, documentType, context);
  }
}