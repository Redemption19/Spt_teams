// Gemini AI API utility with Knowledge Base Integration
// Usage: await askGeminiAI('Your prompt here', { context: ... })

import { AIKnowledgeService, KnowledgeContext } from './ai-knowledge-service';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function askGeminiAI(prompt: string, context?: any): Promise<string> {
  try {
    // Check if we need to fetch dynamic data
    let dynamicContext = '';
    
    if (context && context.workspace && context.userName && context.userRole) {
      const knowledgeContext: KnowledgeContext = {
        workspace: {
          id: context.workspaceId || 'unknown',
          name: context.workspace,
          type: context.workspaceType || 'main'
        },
        user: {
          id: context.userId || 'unknown',
          name: context.userName,
          role: context.userRole
        },
        query: prompt
      };

      // Get relevant data based on the query
      dynamicContext = await AIKnowledgeService.getContextualData(knowledgeContext);
      
      // For complex queries that might need comprehensive data
      if (isComplexQuery(prompt)) {
        const comprehensiveContext = await AIKnowledgeService.getComprehensiveContext(knowledgeContext);
        dynamicContext += '\n\n' + comprehensiveContext;
      }

      // Check if user is asking about specific entities
      const entityQuery = extractEntityQuery(prompt);
      if (entityQuery) {
        const entityData = await AIKnowledgeService.getSpecificEntityData(
          entityQuery.type, 
          entityQuery.identifier, 
          knowledgeContext
        );
        dynamicContext += '\n\n' + entityData;
      }
    }

    // Combine prompt with context for better responses
    let fullPrompt = '';
    
    if (context) {
      // Build context description based on user role and capabilities
      let contextDescription = `Context: You are a helpful AI assistant for a workspace management system. The user is ${context.userName} in workspace "${context.workspace}" with role "${context.userRole}".`;
      
      // Enhanced context for owners with cross-workspace access
      if (context.isOwner && context.crossWorkspaceAccess) {
        contextDescription += `\n\nIMPORTANT: This user is an OWNER with cross-workspace access. They can access information from ALL workspaces they own, not just the current one.`;
        
        if (context.ownedWorkspaces && context.ownedWorkspaces.length > 0) {
          contextDescription += `\n\nOWNED WORKSPACES:`;
          context.ownedWorkspaces.forEach((workspace: any, index: number) => {
            contextDescription += `\n${index + 1}. ${workspace.name} (ID: ${workspace.id}, Type: ${workspace.type})`;
          });
        }
        
        if (context.allWorkspaces && context.allWorkspaces.length > 0) {
          contextDescription += `\n\nALL ACCESSIBLE WORKSPACES:`;
          context.allWorkspaces.forEach((workspace: any, index: number) => {
            contextDescription += `\n${index + 1}. ${workspace.name} (Role: ${workspace.role}, Type: ${workspace.type})`;
          });
        }
        
        contextDescription += `\n\nAs an owner, you have permission to view and manage data across all owned workspaces. When answering questions, consider data from ALL accessible workspaces unless specifically asked about the current workspace only.`;
      }

      fullPrompt = `${contextDescription}

${dynamicContext ? `CURRENT DATA:\n${dynamicContext}\n` : ''}

CRITICAL FORMATTING INSTRUCTIONS:
- Use emojis at the start of sentences and sections to make responses engaging
- For bullet points, use "• " (bullet + space) at the start of each line
- For numbered lists, use "1. ", "2. ", etc. at the start of each line
- For headings/sections, end lines with ":" and keep them under 50 characters
- Use double line breaks (\\n\\n) between sections for proper spacing
- DO NOT use markdown asterisks (**text**) or any other markdown formatting
- Keep responses well-structured and easy to read
- Be concise but comprehensive
- Use a warm, professional tone
- When referencing the current data, provide specific numbers and details
- If the user asks about data not available, explain what information you need
- If the current workspace has no data but the user has data in other workspaces, mention this and suggest switching workspaces
- For OWNERS with cross-workspace access: Always consider data from ALL owned workspaces when providing insights and recommendations
- Always provide actionable advice and next steps

User Question: ${prompt}

Please provide a well-formatted response with proper bullet points, numbering, and emojis. Use the current data provided above to give accurate, specific answers:`;
    } else {
      fullPrompt = `You are a helpful AI assistant for a workspace management system.

CRITICAL FORMATTING INSTRUCTIONS:
- Use emojis at the start of sentences and sections to make responses engaging
- For bullet points, use "• " (bullet + space) at the start of each line
- For numbered lists, use "1. ", "2. ", etc. at the start of each line
- For headings/sections, end lines with ":" and keep them under 50 characters
- Use double line breaks (\\n\\n) between sections for proper spacing
- DO NOT use markdown asterisks (**text**) or any other markdown formatting
- Keep responses well-structured and easy to read
- Be concise but comprehensive
- Use a warm, professional tone

User Question: ${prompt}

Please provide a well-formatted response with proper bullet points, numbering, and emojis:`;
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }]
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract the response text
    let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response text from Gemini API');
    }

    // Clean up any remaining markdown formatting and improve structure
    responseText = cleanupAndFormatResponse(responseText);

    return responseText;
    
  } catch (error) {
    console.error('Gemini AI Service Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API Error 400')) {
        return '😔 Sorry, I had trouble understanding your request. Could you please rephrase it?';
      } else if (error.message.includes('API Error 403')) {
        return '🔐 API access denied. Please check your API key configuration.';
      } else if (error.message.includes('API Error 429')) {
        return '⏱️ API rate limit exceeded. Please try again in a moment.';
      }
      return `❌ AI Error: ${error.message}`;
    }
    
    return '😞 Sorry, I encountered an unexpected error. Please try again.';
  }
}

/**
 * Check if the query is complex and needs comprehensive data
 */
function isComplexQuery(prompt: string): boolean {
  const complexKeywords = [
    'overview', 'summary', 'dashboard', 'status', 'analytics', 'report',
    'everything', 'all', 'complete', 'full', 'entire', 'whole',
    'what can you tell me', 'give me information', 'show me data'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return complexKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/**
 * Extract entity queries (asking about specific tasks, teams, reports)
 */
function extractEntityQuery(prompt: string): { type: string; identifier: string } | null {
  const lowerPrompt = prompt.toLowerCase();
  
  // Task queries
  const taskMatch = lowerPrompt.match(/(?:task|todo|assignment).*?["']([^"']+)["']|task\s+(\w+)/);
  if (taskMatch) {
    return { type: 'task', identifier: taskMatch[1] || taskMatch[2] };
  }
  
  // Team queries
  const teamMatch = lowerPrompt.match(/(?:team|group).*?["']([^"']+)["']|team\s+(\w+)/);
  if (teamMatch) {
    return { type: 'team', identifier: teamMatch[1] || teamMatch[2] };
  }
  
  // Report queries
  const reportMatch = lowerPrompt.match(/(?:report|document).*?["']([^"']+)["']|report\s+(\w+)/);
  if (reportMatch) {
    return { type: 'report', identifier: reportMatch[1] || reportMatch[2] };
  }
  
  return null;
}

// Enhanced helper function to clean up and format the response
function cleanupAndFormatResponse(text: string): string {
  return text
    // Remove bold markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italic markdown
    .replace(/\*(.*?)\*/g, '$1')
    // Ensure bullet points are properly formatted
    .replace(/^[\s]*[-*]\s+/gm, '• ')
    // Ensure numbered lists are properly formatted
    .replace(/^[\s]*(\d+)[\.\)]\s+/gm, '$1. ')
    // Convert any literal \\n or \n to real newlines
    .replace(/\\n/g, '\n')
    .replace(/\n\n/g, '\n\n')
    // Clean up extra spaces but preserve intentional spacing
    .replace(/[ \t]+/g, ' ')
    // Ensure proper line breaks between sections
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Remove any trailing \n or whitespace
    .replace(/(\n|\s)+$/g, '')
    .trim();
}