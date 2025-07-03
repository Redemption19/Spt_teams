// Gemini AI API utility
// Usage: await askGeminiAI('Your prompt here', { context: ... })

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function askGeminiAI(prompt: string, context?: any): Promise<string> {
  try {
    // Combine prompt with context for better responses
    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Context: You are a helpful AI assistant for a workspace management system. The user is in workspace "${context.workspace}" with role "${context.userRole}".

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

    console.log('Sending request to Gemini API...');
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', data);

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