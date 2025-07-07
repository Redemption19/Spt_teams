'use client';

import { StaticKnowledgeService } from '../static-knowledge-service';

export class HelpKnowledgeService {
  /**
   * Check if query is asking for help
   */
  static isHelpRequest(query: string): boolean {
    const helpKeywords = ['how to', 'how do i', 'help me', 'guide', 'tutorial', 'explain', 'what is'];
    return helpKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Extract help topic from query
   */
  static extractHelpTopic(query: string): string | null {
    // Extract topic after "how to", "help with", etc.
    const patterns = [
      /how to (?:create|make|do) (?:a |an )?(\w+)/,
      /help (?:me )?(?:with |create |make )?(?:a |an )?(\w+)/,
      /(?:what is|explain) (?:a |an )?(\w+)/,
      /guide (?:for |to )?(?:a |an )?(\w+)/
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Fallback: look for feature keywords
    const features = ['task', 'team', 'report', 'calendar', 'user', 'workspace'];
    for (const feature of features) {
      if (query.includes(feature)) {
        return feature;
      }
    }

    return null;
  }

  /**
   * Get comprehensive help context
   */
  static getHelpContext(query: string, userRole: string): string {
    let helpContext = '';

    const helpTopic = this.extractHelpTopic(query);
    if (helpTopic) {
      const comprehensiveHelp = StaticKnowledgeService.getComprehensiveHelp(helpTopic);
      helpContext += `\nCOMPREHENSIVE HELP:\n${comprehensiveHelp}\n`;
    }
    
    // Add contextual help based on user role and query
    const contextualHelp = StaticKnowledgeService.getContextualHelp(query, userRole);
    if (contextualHelp) {
      helpContext += `\n${contextualHelp}\n`;
    }

    return helpContext;
  }
}
