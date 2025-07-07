'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VoiceControls } from '@/components/ui/voice-controls';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Mic
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceService } from '@/lib/workspace-service';
import { askGeminiAI } from '@/lib/gemini-ai-service';
import { useVoiceChat } from '@/hooks/use-voice-chat';

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
  const { user, userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  
  // Voice settings state (must be declared before useVoiceChat)
  const [voiceSettings, setVoiceSettings] = useState({
    autoSend: false,
    readResponses: true,
    showTranscript: true
  });

  // State for modals
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Voice chat integration
  const [voiceChatState, voiceChatActions] = useVoiceChat({
    onTranscriptComplete: (transcript) => {
      if (transcript.trim()) {
        setInput(transcript);
        // Auto-send is handled by the hook when autoSubmitOnComplete is true
        // Manual send when auto-send is disabled
        if (!voiceSettings.autoSend) {
          console.log('Manual mode: Transcript set, waiting for user action');
        }
      }
    },
    onAutoSend: (transcript) => {
      // This callback is triggered by the hook when auto-send is enabled
      console.log('Auto-send triggered:', transcript);
      if (transcript.trim()) {
        sendMessage(transcript);
      }
    },
    onSpeechStart: () => {
      // Optional: Show some UI feedback when speech starts
    },
    onSpeechEnd: () => {
      // Optional: Show some UI feedback when speech ends
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      
      // Show troubleshooting for certain errors
      if (error.error === 'not-allowed' || error.error === 'audio-capture' || !error.shouldRetry) {
        setShowTroubleshooting(true);
      }
      
      toast({
        title: '🎤 Voice Error',
        description: error.userMessage || 'There was an issue with voice processing. Please try again.',
        variant: 'destructive',
        action: error.error === 'not-allowed' ? (
          <Button variant="outline" size="sm" onClick={() => setShowTroubleshooting(true)}>
            Help
          </Button>
        ) : undefined,
      });
    },
    autoSubmitOnComplete: voiceSettings.autoSend,
    language: 'en-US'
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `👋 Hello! I'm your AI assistant for ${currentWorkspace?.name || 'your workspace'}!
🚀 How I can help you:
• Project management strategies and best practices
• Task organization and productivity tips 
• Reporting guidance and templates
• General workspace assistance


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
      const textarea = textareaRef.current;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 44; // Minimum height in pixels
      const maxHeight = 120; // Maximum height in pixels
      
      // Set height based on content, constrained by min and max
      if (scrollHeight <= maxHeight) {
        textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
        textarea.style.overflowY = 'hidden';
      } else {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      }
    }
  }, [input]);

  // Keyboard shortcuts for voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + M to toggle voice listening
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && voiceChatState.isSupported) {
        e.preventDefault();
        if (voiceChatState.isListening) {
          voiceChatActions.stopListening();
        } else {
          voiceChatActions.startListening();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [voiceChatState.isListening, voiceChatState.isSupported, voiceChatActions]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date()
    };

    // Special handling for voice test
    if (content.trim() === "Test voice chat capabilities") {
      const testMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🎤 Voice Chat Test Results:

🗣️ Speech-to-Text (STT): ${voiceChatState.isSupported ? '✅ Ready' : '❌ Not Available'}
🔊 Text-to-Speech (TTS): ${voiceChatState.isSupported ? '✅ Ready' : '❌ Not Available'}

🎯 How to use Voice Chat:
• Click the microphone button to start listening
• Speak your question or command clearly
• The transcript will appear above the input box
• Click send or enable "Auto Send" for hands-free operation
• Enable "Read Aloud" to hear AI responses

🚀 Voice Features:
• Real-time speech recognition
• Automatic punctuation and formatting
• Background noise filtering
• Multiple language support
• Customizable voice settings

✨ Try saying: "Tell me about project management best practices" or "How can I organize my tasks better?"

${voiceChatState.isSupported ? '🎉 Your browser supports full voice chat functionality!' : '⚠️ Voice features may be limited in this browser. Try Chrome or Edge for best results.'}`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, testMessage]);
      setInput('');
      return;
    }

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
      // Enhanced context gathering with cross-workspace capabilities
      let workspaceId = currentWorkspace?.id;
      let workspaceName = currentWorkspace?.name;
      let workspaceType = currentWorkspace?.workspaceType;
      let actualUserRole = userRole;
      
      // Always determine user's highest role across all workspaces for cross-workspace capabilities
      let allUserWorkspaces: any[] = [];
      if (user?.uid) {
        console.log('🔍 Main AI Assistant - Checking user\'s highest role across all workspaces...');
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
          allUserWorkspaces = userWorkspaces;
          console.log('🏢 User has access to', userWorkspaces.length, 'workspaces');
          
          // Check if user is an owner in any workspace
          const ownerWorkspaces = userWorkspaces.filter(uw => uw.role === 'owner');
          const adminWorkspaces = userWorkspaces.filter(uw => uw.role === 'admin');
          
          if (ownerWorkspaces.length > 0) {
            actualUserRole = 'owner';
            console.log('👑 User is an OWNER in', ownerWorkspaces.length, 'workspace(s)');
          } else if (adminWorkspaces.length > 0) {
            actualUserRole = 'admin';
            console.log('🛡️ User is an ADMIN in', adminWorkspaces.length, 'workspace(s)');
          } else {
            actualUserRole = 'member';
            console.log('👤 User is a MEMBER in all workspaces');
          }
        } catch (error) {
          console.error('❌ Error determining user role:', error);
          actualUserRole = userRole || 'member';
        }
      }

      const context = {
        workspace: workspaceName || currentWorkspace?.name || 'Unknown Workspace',
        workspaceId: workspaceId || 'unknown',
        workspaceType: workspaceType || 'main',
        userRole: actualUserRole || 'member',
        userName: userProfile?.name || 'User',
        userId: user?.uid || 'unknown',
        // Enhanced context for owners to enable cross-workspace management
        ...(actualUserRole === 'owner' && allUserWorkspaces.length > 0 && {
          isOwner: true,
          ownedWorkspaces: allUserWorkspaces
            .filter(uw => uw.role === 'owner')
            .map(uw => ({
              id: uw.workspace.id,
              name: uw.workspace.name,
              type: uw.workspace.workspaceType,
              role: uw.role
            })),
          allWorkspaces: allUserWorkspaces.map(uw => ({
            id: uw.workspace.id,
            name: uw.workspace.name,
            type: uw.workspace.workspaceType,
            role: uw.role
          })),
          crossWorkspaceAccess: true
        })
      };

      console.log('🔍 Main AI Assistant - Enhanced context:', context);

      const response = await askGeminiAI(content, context);

      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );

      // Read AI response aloud if voice settings enabled
      if (voiceSettings.readResponses && voiceChatState.isSupported) {
        try {
          await voiceChatActions.speak(response);
        } catch (error) {
          console.error('Error reading response:', error);
        }
      }

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
  }, [isLoading, currentWorkspace?.name, currentWorkspace?.id, currentWorkspace?.workspaceType, userRole, user?.uid, userProfile?.name, toast, voiceChatActions, voiceChatState.isSupported, voiceSettings.readResponses]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize on input change
    const textarea = e.target;
    textarea.style.height = 'auto';
    
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 44;
    const maxHeight = 120;
    
    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  // Handle voice input integration
  const handleVoiceInput = useCallback((transcript: string) => {
    setInput(transcript);
  }, []);

  // Toggle voice settings
  const toggleVoiceSetting = useCallback((setting: keyof typeof voiceSettings) => {
    setVoiceSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  // Handle voice configuration changes
  const handleVoiceConfigChange = useCallback((config: { rate?: number; pitch?: number; volume?: number }) => {
    voiceChatActions.setVoiceConfig(config);
  }, [voiceChatActions]);

  // Handle voice selection change
  const handleVoiceChange = useCallback((voice: SpeechSynthesisVoice | null) => {
    voiceChatActions.setSelectedVoice(voice);
  }, [voiceChatActions]);

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
    
    // Clear voice transcript as well
    voiceChatActions.clearTranscript();
    
    toast({
      title: '🧹 Chat Cleared',
      description: 'Your conversation has been reset.',
    });
  }, [currentWorkspace?.name, toast, voiceChatActions]);

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
    <div className="h-full flex flex-col bg-background">
      {/* Chat Container */}
      <div className="w-full h-full flex flex-col bg-card overflow-hidden relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
          {/* Main Header Row */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 bg-gradient-to-r from-primary to-accent">
              <AvatarFallback className="text-white text-sm font-bold">AI</AvatarFallback>
            </Avatar>
            <div className="flex-1 sm:flex-none">
              <div className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 flex-wrap">
                <span>Gemini Assistant</span>
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 animate-pulse">● Online</span>
                {/* {voiceChatState.isSupported && (
                  <Badge variant="secondary" className="text-xs">
                    🎤 Voice Ready
                  </Badge>
                )} */}
              </div>
              <div className="text-xs text-muted-foreground">Your AI workspace copilot</div>
            </div>
            
            {/* Sparkles button - always visible */}
            <Button variant="ghost" size="sm" className="text-accent hover:text-primary sm:hidden">
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Voice Settings Row */}
          {voiceChatState.isSupported && (
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-start sm:justify-end overflow-x-auto">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVoiceSetting('readResponses')}
                  className={`text-xs whitespace-nowrap px-2 py-1 ${voiceSettings.readResponses ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                >
                  <span className="hidden sm:inline">📢 Read Aloud</span>
                  <span className="sm:hidden">📢</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVoiceSetting('autoSend')}
                  className={`text-xs whitespace-nowrap px-2 py-1 ${voiceSettings.autoSend ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                >
                  <span className="hidden sm:inline">🚀 Auto Send</span>
                  <span className="sm:hidden">🚀</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceSettings(true)}
                  className="text-xs text-muted-foreground hover:text-primary whitespace-nowrap px-2 py-1"
                >
                  <span className="hidden sm:inline">⚙️ Settings</span>
                  <span className="sm:hidden">⚙️</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTroubleshooting(true)}
                  className="text-xs text-muted-foreground hover:text-primary whitespace-nowrap px-2 py-1"
                >
                  <span className="hidden sm:inline">🛠️ Help</span>
                  <span className="sm:hidden">🛠️</span>
                </Button>
              </div>
            </div>
          )}
          
          {/* Sparkles button - desktop only */}
          <Button variant="ghost" size="sm" className="text-accent hover:text-primary hidden sm:block">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 custom-scrollbar" ref={scrollAreaRef} style={{ scrollBehavior: 'smooth' }}>
          <div className="flex flex-col gap-3 sm:gap-4">
            {messages.map((message, idx) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end group`}>
                {!message.isUser && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mr-2 bg-gradient-to-r from-primary to-accent">
                    <AvatarFallback className="text-white"><Bot className="h-3 w-3 sm:h-4 sm:w-4" /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`${message.isUser ? 'max-w-[85%] order-2' : 'max-w-[90%] w-full'}`}> 
                  <div
                    className={`rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm transition-all duration-200 ${
                      message.isUser
                        ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground ml-auto rounded-br-md'
                        : message.error
                        ? 'bg-destructive/10 text-destructive border border-destructive'
                        : 'bg-secondary text-foreground rounded-bl-md'
                    }`}
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
                      <div className="text-sm leading-relaxed">
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
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ml-2 sm:ml-3 bg-gradient-to-r from-primary to-accent">
                    <AvatarFallback className="text-white"><User className="h-3 w-3 sm:h-4 sm:w-4" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Voice Transcript Display */}
        {voiceChatState.isSupported && voiceSettings.showTranscript && (voiceChatState.transcript || voiceChatState.interimTranscript) && (
          <div className="mx-4 sm:mx-8 mb-4 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Voice Transcript</span>
                {voiceChatState.isListening && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    🎤 Listening...
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={voiceChatActions.clearTranscript}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            </div>
            <div className="text-sm">
              <span className="text-foreground">{voiceChatState.transcript}</span>
              {voiceChatState.interimTranscript && (
                <span className="text-muted-foreground italic">
                  {voiceChatState.transcript ? ' ' : ''}{voiceChatState.interimTranscript}
                </span>
              )}
            </div>
            {voiceChatState.transcript && !voiceSettings.autoSend && (
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInput(voiceChatState.transcript);
                    voiceChatActions.clearTranscript();
                  }}
                  className="text-xs"
                >
                  ✏️ Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    sendMessage(voiceChatState.transcript);
                    voiceChatActions.clearTranscript();
                  }}
                  className="text-xs"
                >
                  🚀 Send
                </Button>
              </div>
            )}
            {voiceChatState.transcript && voiceSettings.autoSend && (
              <div className="mt-2 text-xs text-muted-foreground">
                ⚡ Auto-send enabled - message will be sent automatically
              </div>
            )}
          </div>
        )}

        {/* Simple Voice Settings Modal */}
        {showVoiceSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowVoiceSettings(false)}>
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🎤 Voice Settings</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowVoiceSettings(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Select AI Voice:</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={voiceChatActions.refreshVoices}
                      className="text-xs text-muted-foreground hover:text-primary"
                      title="Refresh available voices"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                    value={voiceChatState.selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = voiceChatState.voices.find(v => v.name === e.target.value);
                      voiceChatActions.setSelectedVoice(voice || null);
                    }}
                  >
                    <option value="">Select a voice...</option>
                    {voiceChatState.voices
                      .filter(voice => voice.lang.startsWith('en'))
                      .map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                  </select>
                  {voiceChatState.voices.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No voices available. Try refreshing or check browser permissions.
                    </p>
                  )}
                  {voiceChatState.voices.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {voiceChatState.voices.length} voices available ({voiceChatState.voices.filter(v => v.lang.startsWith('en')).length} English)
                    </p>
                  )}
                </div>
                
                {voiceChatState.selectedVoice && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={async () => {
                          try {
                            await voiceChatActions.speak("Hello! This is how I sound. You can choose a different voice if you prefer.");
                          } catch (error) {
                            console.error('Voice test failed:', error);
                          }
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        🔊 Test Voice
                      </Button>
                      <Button 
                        onClick={() => voiceChatActions.stopSpeaking()}
                        variant="outline"
                        size="sm"
                      >
                        ⏹️ Stop
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => voiceChatActions.saveAsDefaultVoice(voiceChatState.selectedVoice!)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        ⭐ Set as Default
                      </Button>
                      <Button 
                        onClick={voiceChatActions.clearDefaultVoice}
                        variant="outline"
                        size="sm"
                      >
                        🗑️ Clear Default
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  💡 Tip: Choose a voice and set it as default to use automatically. You can change this anytime.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Simple Troubleshooting Modal */}
        {showTroubleshooting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTroubleshooting(false)}>
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>🛠️ Voice Help</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowTroubleshooting(false)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Common Issues:</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Allow microphone access when prompted</li>
                      <li>• Make sure you&apos;re using HTTPS</li>
                      <li>• Check your microphone is working</li>
                      <li>• Try refreshing the page</li>
                      <li>• Use Chrome or Edge for best support</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          stream.getTracks().forEach(track => track.stop());
                          alert('✅ Microphone working!');
                        } catch (error) {
                          alert('❌ Microphone access failed');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      🎤 Test Mic
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Input Area */}
        <div className="sticky bottom-0 left-0 w-full bg-gradient-to-t from-card to-card/60 px-3 sm:px-4 py-2 sm:py-3 border-t border-border flex items-end gap-2 z-10">
          {/* Voice Controls */}
          {voiceChatState.isSupported && (
            <VoiceControls
              isListening={voiceChatState.isListening}
              isSpeaking={voiceChatState.isSpeaking}
              isSupported={voiceChatState.isSupported}
              transcript={voiceChatState.transcript}
              interimTranscript={voiceChatState.interimTranscript}
              onStartListening={voiceChatActions.startListening}
              onStopListening={voiceChatActions.stopListening}
              onStopSpeaking={voiceChatActions.stopSpeaking}
              disabled={isLoading}
              className="flex-shrink-0"
            />
          )}
          
          <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                voiceChatState.isListening 
                  ? "🎤 Listening..." 
                  : voiceChatState.isSupported 
                    ? "Type or use voice (Ctrl+M)..."
                    : "Type your message..."
              }
              className="min-h-[40px] max-h-[100px] resize-none rounded-xl border-2 border-border bg-card px-3 py-2 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
              disabled={isLoading}
              style={{ 
                minHeight: '40px',
                maxHeight: '100px',
                resize: 'none'
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 p-0 bg-gradient-to-br from-primary to-accent hover:from-accent hover:to-primary text-primary-foreground rounded-full shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}