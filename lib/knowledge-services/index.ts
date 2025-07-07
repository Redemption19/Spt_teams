// Knowledge Services Index
// This file provides easy access to all knowledge service modules

export { AnalyticsKnowledgeService } from './analytics-knowledge';
export { CalendarKnowledgeService } from './calendar-knowledge';
export { SuggestionKnowledgeService } from './suggestion-knowledge';
export { EntityKnowledgeService } from './entity-knowledge';
export { DocumentKnowledgeService } from './document-knowledge';
export { HelpKnowledgeService } from './help-knowledge';

// Re-export main interface for convenience
export type { KnowledgeContext } from '../ai-knowledge-service';
