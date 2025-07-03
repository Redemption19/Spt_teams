'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  RefreshCw,
  Sparkles,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { askGeminiAI } from '@/lib/gemini-ai-service';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

export default function AIAssistantMain() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `👋 Hello! I'm your AI assistant for ${currentWorkspace?.name || 'your workspace'}!

🚀 How I can help you:
• Project management strategies and best practices
• Task organization and productivity tips  
• Team collaboration and communication advice
• Reporting guidance and templates
• Workflow optimization suggestions
• General workspace assistance

✨ I provide well-formatted, helpful responses with emojis to make our conversation engaging and easy to read!

💬 What would you like to know about managing your workspace?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date()
    };

    // Special handling for formatting test
    if (content.trim() === "Show me a formatting test") {
      const testMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🧪 Formatting Test Results:

Here are different formatting examples:

🎯 Main Heading:
This demonstrates how headings work with emojis.

📝 Bullet Points:
• First bullet point with important information
• Second bullet point with more details
• Third bullet point with additional context

🔢 Numbered Lists:
1. First numbered item explaining step one
2. Second numbered item with step two details  
3. Third numbered item completing the process

✨ Regular Paragraphs:
This is a regular paragraph that should display normally with proper spacing and formatting.

🚀 Another Section:
This shows how sections are separated and formatted with proper spacing between different content blocks.`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, testMessage]);
      setInput('');
      return;
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        workspace: currentWorkspace?.name || 'Unknown Workspace',
        userRole: userRole || 'member'
      };

      const response = await askGeminiAI(content, context);

      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );

    } catch (error) {
      console.error('Error sending message:', error);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { 
                ...msg, 
                content: '😞 Sorry, I encountered an error. Please try again.', 
                isLoading: false,
                error: true 
              }
            : msg
        )
      );

      toast({
        title: '❌ Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentWorkspace?.name, userRole, toast]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: '1',
        content: `👋 Hello! I'm your AI assistant for ${currentWorkspace?.name || 'your workspace'}!

🚀 How I can help you:
• Project management strategies and best practices
• Task organization and productivity tips  
• Team collaboration and communication advice
• Reporting guidance and templates
• Workflow optimization suggestions
• General workspace assistance

✨ I provide well-formatted, helpful responses with emojis to make our conversation engaging and easy to read!

💬 What would you like to know about managing your workspace?`,
        isUser: false,
        timestamp: new Date()
      }
    ]);
    
    toast({
      title: '🧹 Chat Cleared',
      description: 'Your conversation has been reset.',
    });
  }, [currentWorkspace?.name, toast]);

  const retryMessage = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    // Find the user message that prompted this AI response
    const messageIndex = messages.findIndex(m => m.id === messageId);
    const userMessage = messages[messageIndex - 1];
    
    if (userMessage && userMessage.isUser) {
      // Remove the error message and resend
      setMessages(prev => prev.filter(m => m.id !== messageId));
      sendMessage(userMessage.content);
    }
  }, [messages, sendMessage]);

  const quickPrompts = [
    { icon: MessageSquare, text: "How can I improve team communication?", emoji: "💬" },
    { icon: TrendingUp, text: "What are best practices for project management?", emoji: "📈" },
    { icon: Lightbulb, text: "Give me tips for better task organization", emoji: "💡" },
    { icon: HelpCircle, text: "How do I create effective reports?", emoji: "📊" },
    { icon: Bot, text: "Show me a formatting test", emoji: "🧪" }
  ];

  // Format message content with proper line breaks and styling
  const formatMessageContent = useCallback((content: string) => {
    console.log('Formatting content:', content); // Debug log
    
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle empty lines with spacing
      if (trimmedLine === '') {
        return <div key={index} className="h-3" />; // Add spacing for empty lines
      }
      
      // Add extra spacing after emojis for better readability
      let formattedLine = line.replace(/([\u{1F300}-\u{1F9FF}])/gu, '$1 ');
      
      // Handle bullet points with better styling
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const bulletContent = formattedLine.replace(/^[\s]*[•\-*]\s*/, '');
        return (
          <div key={index} className="flex items-start space-x-3 leading-relaxed mb-2">
            <span className="text-primary font-bold mt-0.5 text-base">•</span>
            <span className="flex-1">{bulletContent}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)[\.\)]\s+(.+)/);
      if (numberedMatch) {
        return (
          <div key={index} className="flex items-start space-x-3 leading-relaxed mb-2">
            <span className="text-primary font-bold mt-0.5 min-w-[1.5rem]">{numberedMatch[1]}.</span>
            <span className="flex-1">{numberedMatch[2]}</span>
          </div>
        );
      }
      
      // Handle headings (lines that end with : or are all caps or have specific patterns)
      if (
        (trimmedLine.endsWith(':') && !trimmedLine.includes('?') && trimmedLine.length < 60) ||
        (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && trimmedLine.length < 40) ||
        trimmedLine.match(/^[🎯🚀💡📊🔧⚡✨🌟💪🎨📈🔥💼🏆📋]/u)
      ) {
        return (
          <div key={index} className="font-bold text-foreground leading-relaxed mb-3 mt-4 first:mt-0 text-base">
            {formattedLine}
          </div>
        );
      }
      
      // Handle regular paragraphs
      return (
        <div key={index} className="leading-relaxed mb-2">
          {formattedLine}
        </div>
      );
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-8 px-2">
      {/* Chat Container */}
      <div className="w-full max-w-4xl flex flex-col rounded-3xl shadow-2xl bg-card border border-border overflow-hidden relative" style={{ minHeight: 600, maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-8 py-5 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20">
          <Avatar className="h-12 w-12 bg-gradient-to-r from-primary to-accent">
            <AvatarFallback className="text-white text-lg font-bold">AI</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold text-xl text-foreground flex items-center gap-2">
              Gemini Assistant
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 animate-pulse">● Online</span>
            </div>
            <div className="text-xs text-muted-foreground">Your AI workspace copilot</div>
          </div>
          <Button variant="ghost" size="icon" className="text-accent hover:text-primary">
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar" ref={scrollAreaRef} style={{ scrollBehavior: 'smooth' }}>
          <div className="flex flex-col gap-6">
            {messages.map((message, idx) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end group`}>
                {!message.isUser && (
                  <Avatar className="h-9 w-9 mr-3 bg-gradient-to-r from-primary to-accent">
                    <AvatarFallback className="text-white"><Bot className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`${message.isUser ? 'max-w-[75%] order-2' : 'max-w-[95%] w-full'}`}> 
                  <div
                    className={`rounded-2xl px-6 py-4 shadow-md transition-all duration-200 ${
                      message.isUser
                        ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground ml-auto rounded-br-md hover:shadow-lg'
                        : message.error
                        ? 'bg-destructive/10 text-destructive border border-destructive'
                        : 'bg-secondary text-foreground rounded-bl-md hover:shadow-lg'
                    } group-hover:scale-[1.02]`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">AI is typing...</span>
                      </div>
                    ) : (
                      <div className="text-base leading-relaxed">
                        {formatMessageContent(message.content)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                {message.isUser && (
                  <Avatar className="h-9 w-9 ml-3 bg-gradient-to-r from-primary to-accent">
                    <AvatarFallback className="text-white"><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-card/90 to-card/60 px-8 py-5 border-t border-border flex items-end gap-3 z-10">
          {/* Emoji/Attachment Placeholder */}
          <Button variant="ghost" size="icon" className="text-accent hover:text-primary" disabled>
            <span role="img" aria-label="emoji">😊</span>
          </Button>
          <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-2xl border-2 border-border bg-card px-4 py-2 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 p-0 bg-gradient-to-br from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground rounded-full shadow-lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}