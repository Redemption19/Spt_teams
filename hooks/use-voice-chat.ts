'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceChatService, VoiceConfig, VoiceRecognitionConfig } from '@/lib/voice-chat-service';
import { useToast } from '@/hooks/use-toast';

export interface VoiceChatState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  voiceConfig: VoiceConfig;
  error: string | null;
}

export interface VoiceChatActions {
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  setVoiceConfig: (config: Partial<VoiceConfig>) => void;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  clearTranscript: () => void;
  toggleListening: () => void;
  saveAsDefaultVoice: (voice: SpeechSynthesisVoice) => void;
  clearDefaultVoice: () => void;
  refreshVoices: () => void;
}

export interface UseVoiceChatOptions {
  onTranscriptComplete?: (transcript: string) => void;
  onAutoSend?: (transcript: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: any) => void;
  autoSubmitOnComplete?: boolean;
  language?: string;
}

export function useVoiceChat(options: UseVoiceChatOptions = {}): [VoiceChatState, VoiceChatActions] {
  const { toast } = useToast();
  const {
    onTranscriptComplete,
    onAutoSend,
    onSpeechStart,
    onSpeechEnd,
    onError,
    autoSubmitOnComplete = false,
    language = 'en-US'
  } = options;

  const [state, setState] = useState<VoiceChatState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    isSupported: false,
    voices: [],
    selectedVoice: null,
    voiceConfig: {
      language,
      rate: 1,
      pitch: 1,
      volume: 1
    },
    error: null
  });

  const initializationRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Initialize voice services
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initialize = async () => {
      try {
        const supported = VoiceChatService.initialize();
        const support = VoiceChatService.checkSupport();
        
        // Wait for voices to be loaded
        let voices = VoiceChatService.getVoices();
        let attempts = 0;
        const maxAttempts = 10;
        
        // Retry getting voices if none are loaded (Chrome needs this)
        while (voices.length === 0 && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          voices = VoiceChatService.getVoices();
          attempts++;
        }
        
        const defaultVoice = VoiceChatService.getDefaultVoice(language);
        
        console.log('Voice initialization:', { 
          supported, 
          support, 
          voicesCount: voices.length, 
          defaultVoice: defaultVoice?.name 
        });

        setState(prev => ({
          ...prev,
          isSupported: support.fullSupport,
          voices,
          selectedVoice: defaultVoice,
          voiceConfig: {
            ...prev.voiceConfig,
            voice: defaultVoice || undefined
          }
        }));

        if (!support.fullSupport) {
          const missingFeatures = [];
          if (!support.speechSynthesis) missingFeatures.push('Text-to-Speech');
          if (!support.speechRecognition) missingFeatures.push('Speech-to-Text');
          
          toast({
            title: '⚠️ Limited Voice Support',
            description: `${missingFeatures.join(' and ')} not supported in this browser.`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Voice service initialization failed:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to initialize voice services',
          isSupported: false
        }));
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    setTimeout(initialize, 100);

    return () => {
      VoiceChatService.cleanup();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, toast]);

  // Stop listening
  const stopListening = useCallback(() => {
    VoiceChatService.stopListening();
    setState(prev => ({ ...prev, isListening: false }));
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (!state.isSupported || state.isListening) return;

    setState(prev => ({ ...prev, error: null, transcript: '', interimTranscript: '' }));

    const success = VoiceChatService.startListening(
      { language },
      (transcript, isFinal) => {
        setState(prev => ({
          ...prev,
          transcript: isFinal ? transcript : prev.transcript,
          interimTranscript: isFinal ? '' : transcript
        }));

        if (isFinal && transcript.trim()) {
          console.log('Final transcript received:', transcript, 'autoSubmit:', autoSubmitOnComplete);
          
          // Always call the completion callback
          onTranscriptComplete?.(transcript);
          
          // If auto-submit is enabled, trigger auto-send and stop listening
          if (autoSubmitOnComplete) {
            console.log('Auto-submit enabled, triggering auto-send...');
            
            // Stop listening first
            timeoutRef.current = setTimeout(() => {
              VoiceChatService.stopListening();
              setState(prev => ({ ...prev, isListening: false }));
              
              // Then trigger auto-send
              onAutoSend?.(transcript);
            }, 200); // Short delay to ensure transcript is processed
          }
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          error: `Speech recognition error: ${error.error || 'Unknown error'}` 
        }));
        onError?.(error);
        
        toast({
          title: '🎤 Speech Recognition Error',
          description: 'Failed to recognize speech. Please try again.',
          variant: 'destructive',
        });
      },
      () => {
        setState(prev => ({ ...prev, isListening: true }));
        onSpeechStart?.();
      },
      () => {
        setState(prev => ({ ...prev, isListening: false }));
        onSpeechEnd?.();
      }
    );

    if (!success) {
      toast({
        title: '🎤 Microphone Access',
        description: 'Please allow microphone access to use voice input.',
        variant: 'destructive',
      });
    }
  }, [state.isSupported, state.isListening, language, onTranscriptComplete, onAutoSend, autoSubmitOnComplete, onError, onSpeechStart, onSpeechEnd, toast]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Speak text
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!state.isSupported || !text.trim()) return;

    setState(prev => ({ ...prev, error: null }));

    try {
      // Format text for better speech
      const speechText = VoiceChatService.formatForSpeech(text);
      
      await VoiceChatService.speak(
        speechText,
        state.voiceConfig,
        () => setState(prev => ({ ...prev, isSpeaking: true })),
        () => setState(prev => ({ ...prev, isSpeaking: false })),
        (error) => {
          console.error('Speech synthesis error:', error);
          setState(prev => ({ 
            ...prev, 
            isSpeaking: false, 
            error: 'Speech synthesis failed' 
          }));
          
          toast({
            title: '🔊 Speech Error',
            description: 'Failed to speak text. Please try again.',
            variant: 'destructive',
          });
        }
      );
    } catch (error) {
      console.error('Speak error:', error);
      setState(prev => ({ ...prev, isSpeaking: false, error: 'Failed to speak text' }));
    }
  }, [state.isSupported, state.voiceConfig, toast]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    VoiceChatService.stopSpeaking();
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  // Update voice configuration
  const setVoiceConfig = useCallback((config: Partial<VoiceConfig>) => {
    setState(prev => ({
      ...prev,
      voiceConfig: { ...prev.voiceConfig, ...config }
    }));
  }, []);

  // Set selected voice
  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setState(prev => ({
      ...prev,
      selectedVoice: voice,
      voiceConfig: {
        ...prev.voiceConfig,
        voice: voice || undefined
      }
    }));
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  // Save voice as default preference
  const saveAsDefaultVoice = useCallback((voice: SpeechSynthesisVoice) => {
    VoiceChatService.saveDefaultVoice(voice);
    toast({
      title: '🎤 Default Voice Set',
      description: `${voice.name} has been set as your default voice.`,
    });
  }, [toast]);

  // Clear default voice preference
  const clearDefaultVoice = useCallback(() => {
    VoiceChatService.clearDefaultVoicePreference();
    toast({
      title: '🎤 Default Voice Cleared',
      description: 'Default voice preference has been removed.',
    });
  }, [toast]);

  // Refresh voices and apply default
  const refreshVoices = useCallback(() => {
    const voices = VoiceChatService.getVoices();
    const defaultVoice = VoiceChatService.getDefaultVoice(language);
    
    setState(prev => ({
      ...prev,
      voices,
      selectedVoice: defaultVoice,
      voiceConfig: {
        ...prev.voiceConfig,
        voice: defaultVoice || undefined
      }
    }));

    toast({
      title: '🔄 Voices Refreshed',
      description: `Found ${voices.length} voices. ${defaultVoice ? `Default: ${defaultVoice.name}` : 'No default set.'}`,
    });
  }, [language, toast]);

  const actions: VoiceChatActions = {
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoiceConfig,
    setSelectedVoice,
    clearTranscript,
    toggleListening,
    saveAsDefaultVoice,
    clearDefaultVoice,
    refreshVoices
  };

  return [state, actions];
}
