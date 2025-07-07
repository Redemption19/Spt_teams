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
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  RefreshCw,
  Mic,
  Settings
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useWorkspace } from '@/lib/workspace-context';
import { WorkspaceService } from '@/lib/workspace-service';
import { askGeminiAI } from '@/lib/gemini-ai-service';
import { useVoiceChat } from '@/hooks/use-voice-chat';
import { useToast } from '@/hooks/use-toast';
import { useFloatingAssistantVisibility } from './use-visibility';
import { useWorkspaceAssistant } from './assistant-provider';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

export default function FloatingWorkspaceAssistant() {
  const { user, userProfile } = useAuth();
  const { currentWorkspace, userRole } = useWorkspace();
  const { toast } = useToast();
  const shouldShow = useFloatingAssistantVisibility();
  const { isEnabled, isVisible } = useWorkspaceAssistant();
  
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
        setInputMessage(transcript);
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
        handleSendMessage();
      }
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      
      if (error.error === 'not-allowed' || error.error === 'audio-capture' || !error.shouldRetry) {
        setShowTroubleshooting(true);
      }
      
      toast({
        title: '🎤 Voice Error',
        description: error.userMessage || 'There was an issue with voice processing. Please try again.',
        variant: 'destructive',
      });
    },
    autoSubmitOnComplete: voiceSettings.autoSend,
    language: 'en-US'
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && !conversationStarted && shouldShow) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: `👋 Hello ${userProfile?.name || 'there'}! I'm your Workspace Assistant for ${currentWorkspace?.name || 'your workspace'}!

🚀 How I can help you:
• Project management strategies and best practices
• Task organization and productivity tips  
• Workspace navigation and feature explanations

💡Ask me specific questions about your current workspace or general productivity advice!`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setConversationStarted(true);
    }
  }, [isOpen, conversationStarted, userProfile?.name, currentWorkspace?.name, shouldShow]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (shouldShow) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldShow]);

  // Keyboard shortcuts for voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only activate when floating assistant is open and voice is supported
      if (isOpen && voiceChatState.isSupported) {
        // Ctrl/Cmd + M to toggle voice listening
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
          e.preventDefault();
          if (voiceChatState.isListening) {
            voiceChatActions.stopListening();
          } else {
            voiceChatActions.startListening();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, voiceChatState.isListening, voiceChatState.isSupported, voiceChatActions]);

  // Auto-resize textarea with real-time input handling
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize on input change
    const textarea = e.target;
    textarea.style.height = 'auto';
    
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 60; // min-h-[60px]
    const maxHeight = 128; // max-h-32
    
    if (scrollHeight <= maxHeight) {
      textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    }
  }, []);

  // Auto-resize textarea based on content (for programmatic changes)
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight, but cap at max-height (128px)
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 128; // 32 * 4 = 128px for max-h-32
      const minHeight = 60; // 60px for min-h-[60px]
      
      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`;
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        textareaRef.current.style.height = `${maxHeight}px`;
        textareaRef.current.style.overflowY = 'auto';
      }
    }
  }, [inputMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading || !shouldShow) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    // Special handling for voice test
    if (inputMessage.trim() === "Test voice chat capabilities") {
      const testMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `🎤 Voice Chat Test Results:

🗣️ Speech-to-Text (STT): ${voiceChatState.isSupported ? '✅ Ready' : '❌ Not Available'}
🔊 Text-to-Speech (TTS): ${voiceChatState.isSupported ? '✅ Ready' : '❌ Not Available'}

🎯 How to use Voice Chat:
• Click the microphone button to start listening
• Speak your question clearly
• Enable "Auto Send" for hands-free operation
• Enable "Read Aloud" to hear AI responses

🚀 Voice Features:
• Real-time speech recognition
• Background noise filtering
• Customizable voice settings

${voiceChatState.isSupported ? '🎉 Your browser supports full voice chat functionality!' : '⚠️ Voice features may be limited in this browser. Try Chrome or Edge for best results.'}`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, testMessage]);
      setInputMessage('');
      return;
    }

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'Thinking...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Enhanced context gathering with fallback strategies
      let workspaceId = currentWorkspace?.id;
      let workspaceName = currentWorkspace?.name;
      let workspaceType = currentWorkspace?.workspaceType;
      let actualUserRole = userRole;
      
      // If no current workspace, try to get from localStorage or URL
      if (!workspaceId) {
        const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
        if (savedWorkspaceId) {
          workspaceId = savedWorkspaceId;
          workspaceName = `Workspace ${savedWorkspaceId}`;
          workspaceType = 'main';
        }
      }
      
      // If still no workspace, try to get user's first workspace
      if (!workspaceId && user?.uid) {
        console.log('🔍 No current workspace, trying to get user workspaces...');
        try {
          const userWorkspaces = await WorkspaceService.getUserWorkspaces(user.uid);
          if (userWorkspaces.length > 0) {
            workspaceId = userWorkspaces[0].workspace.id;
            workspaceName = userWorkspaces[0].workspace.name;
            workspaceType = userWorkspaces[0].workspace.workspaceType;
            console.log('✅ Found user workspace:', { workspaceId, workspaceName });
          }
        } catch (error) {
          console.error('❌ Error getting user workspaces:', error);
        }
      }
      
      // Always determine user's highest role across all workspaces for cross-workspace capabilities
      let allUserWorkspaces: any[] = [];
      if (user?.uid) {
        console.log('🔍 Checking user\'s highest role across all workspaces...');
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
        workspace: workspaceName || 'Unknown Workspace',
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

      console.log('🔍 FloatingAssistant - Enhanced context:', context);

      const response = await askGeminiAI(inputMessage.trim(), context);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: response, isLoading: false }
          : msg
      ));

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
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { 
              ...msg, 
              content: '😞 Sorry, I encountered an error. Please try again.', 
              isLoading: false,
              error: true
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, currentWorkspace?.name, currentWorkspace?.id, currentWorkspace?.workspaceType, userRole, userProfile?.name, user?.uid, shouldShow, voiceChatActions, voiceChatState.isSupported, voiceSettings.readResponses]);

  // Toggle voice settings
  const toggleVoiceSetting = useCallback((setting: keyof typeof voiceSettings) => {
    setVoiceSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationStarted(false);
    voiceChatActions.clearTranscript();
  };

  // Don't render if not authenticated, on excluded pages, or disabled in settings
  if (!shouldShow || !isEnabled || !isVisible) {
    return null;
  }

  const formatMessageContent = (content: string) => {
    // Split content into lines and format
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('• ')) {
        return (
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-primary">•</span>
            <span>{trimmedLine.substring(2)}</span>
          </div>
        );
      }
      
      if (trimmedLine.match(/^\d+\.\s/)) {
        const [number, ...rest] = trimmedLine.split('.');
        return (
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-primary font-medium">{number}.</span>
            <span>{rest.join('.').trim()}</span>
          </div>
        );
      }
      
      if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
        return (
          <div key={index} className="font-medium text-foreground mt-3 mb-1">
            {trimmedLine}
          </div>
        );
      }
      
      return trimmedLine ? (
        <div key={index} className="my-1">{trimmedLine}</div>
      ) : (
        <div key={index} className="my-2"></div>
      );
    });
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Bot className="h-6 w-6 text-primary-foreground" />
        </Button>
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
        {/* Voice indicator when supported */}
        {voiceChatState.isSupported && (
          <div className="absolute -top-1 -left-1 bg-green-500 rounded-full p-1">
            <Mic className="h-2 w-2 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`transition-all duration-300 shadow-xl ${
        isMinimized ? 'w-96 h-16' : 'w-96 h-[600px]'
      }`}>
        <CardHeader className="pb-2 px-4 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">Workspace Assistant</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                  AI
                </Badge>
                {voiceChatState.isSupported && (
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                    🎤 Voice
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {/* Voice Settings */}
              {voiceChatState.isSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceSettings(true)}
                  className="h-6 w-6 p-0 hover:bg-white/20"
                  title="Voice Settings"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0 hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[536px]">
            {/* Voice Transcript Display */}
            {voiceChatState.isSupported && voiceSettings.showTranscript && (voiceChatState.transcript || voiceChatState.interimTranscript) && (
              <div className="mx-4 mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Voice Input</span>
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
                    className="text-xs text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs">
                  <span className="text-foreground">{voiceChatState.transcript}</span>
                  {voiceChatState.interimTranscript && (
                    <span className="text-muted-foreground italic">
                      {voiceChatState.transcript ? ' ' : ''}{voiceChatState.interimTranscript}
                    </span>
                  )}
                </div>                  {voiceChatState.transcript && !voiceSettings.autoSend && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setInputMessage(voiceChatState.transcript);
                          voiceChatActions.clearTranscript();
                        }}
                        className="text-xs h-6"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setInputMessage(voiceChatState.transcript);
                          voiceChatActions.clearTranscript();
                          handleSendMessage();
                        }}
                        className="text-xs h-6"
                      >
                        🚀 Send
                      </Button>
                    </div>
                  )}
                  {voiceChatState.transcript && voiceSettings.autoSend && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      ⚡ Auto-send enabled
                    </div>
                  )}
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[90%] ${
                        message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={`${
                          message.isUser 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        }`}>
                          {message.isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-4 text-sm leading-relaxed ${
                          message.isUser
                            ? 'bg-primary text-primary-foreground'
                            : message.error
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {formatMessageContent(message.content)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex items-end space-x-2">
                {/* Voice Controls */}
                {voiceChatState.isSupported && (
                  <div className="flex flex-col space-y-1">
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
                      className="h-10 w-10"
                    />
                  </div>
                )}
                
                <Textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    voiceChatState.isListening 
                      ? "🎤 Listening... or type your message..." 
                      : voiceChatState.isSupported 
                        ? "Ask me anything... or use voice (Ctrl+M)"
                        : "Ask me anything about your workspace..."
                  }
                  className="flex-1 resize-none min-h-[60px] max-h-32 text-sm leading-relaxed"
                  style={{ 
                    minHeight: '60px',
                    maxHeight: '128px',
                    resize: 'none'
                  }}
                />
                <div className="flex flex-col space-y-1">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="h-10 w-10 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  {messages.length > 1 && (
                    <Button
                      onClick={clearConversation}
                      variant="outline"
                      size="sm"
                      className="h-9 w-10 p-0"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Voice Settings Quick Toggles */}
              {voiceChatState.isSupported && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVoiceSetting('readResponses')}
                    className={`h-6 text-xs ${voiceSettings.readResponses ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                  >
                    🔊 Read Aloud
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVoiceSetting('autoSend')}
                    className={`h-6 text-xs ${voiceSettings.autoSend ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                  >
                    🚀 Auto Send
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        )}
        
        {/* Voice Settings Modal */}
        {showVoiceSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowVoiceSettings(false)}>
            <Card className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>🎤 Voice Settings</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowVoiceSettings(false)} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Select AI Voice:</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={voiceChatActions.refreshVoices}
                      className="text-xs text-muted-foreground hover:text-primary h-6 w-6 p-0"
                      title="Refresh available voices"
                    >
                      🔄
                    </Button>
                  </div>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md bg-background text-sm"
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
                      No voices available. Try refreshing.
                    </p>
                  )}
                  {voiceChatState.voices.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {voiceChatState.voices.filter(v => v.lang.startsWith('en')).length} English voices available
                    </p>
                  )}
                </div>
                
                {voiceChatState.selectedVoice && (
                  <div className="space-y-2">
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
                        className="flex-1 text-xs"
                      >
                        🔊 Test Voice
                      </Button>
                      <Button 
                        onClick={() => voiceChatActions.stopSpeaking()}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        ⏹️ Stop
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => voiceChatActions.saveAsDefaultVoice(voiceChatState.selectedVoice!)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        ⭐ Set as Default
                      </Button>
                      <Button 
                        onClick={voiceChatActions.clearDefaultVoice}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        🗑️ Clear Default
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  💡 Tip: Choose a voice and set it as default to use automatically. Press Ctrl+M to start voice input.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Troubleshooting Modal */}
        {showTroubleshooting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTroubleshooting(false)}>
            <Card className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>🛠️ Voice Help</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowTroubleshooting(false)} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-sm">Common Issues:</h4>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
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
                          toast({
                            title: '✅ Microphone Test',
                            description: 'Microphone is working!',
                          });
                        } catch (error) {
                          toast({
                            title: '❌ Microphone Test',
                            description: 'Microphone access failed',
                            variant: 'destructive',
                          });
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      🎤 Test Mic
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
