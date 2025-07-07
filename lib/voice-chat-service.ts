'use client';

export interface VoiceConfig {
  language: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export class VoiceChatService {
  private static synthesis: SpeechSynthesis | null = null;
  private static recognition: any = null; // SpeechRecognition
  private static voices: SpeechSynthesisVoice[] = [];
  private static isListening = false;

  // Initialize voice services
  static initialize(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
      }

      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Voice services initialization failed:', error);
      return false;
    }
  }

  // Load available voices
  private static loadVoices() {
    if (!this.synthesis) return;

    const updateVoices = () => {
      this.voices = this.synthesis!.getVoices();
      console.log('Voices loaded:', this.voices.length, this.voices);
    };

    // Get voices immediately
    updateVoices();
    
    // Also listen for voices changed event (Chrome needs this)
    this.synthesis.onvoiceschanged = updateVoices;
    
    // For Chrome, also try to get voices after a small delay
    if (this.voices.length === 0) {
      setTimeout(updateVoices, 100);
      setTimeout(updateVoices, 500);
      setTimeout(updateVoices, 1000);
    }
  }

  // Get available voices (with retry logic)
  static getVoices(): SpeechSynthesisVoice[] {
    // If no voices loaded yet, try to load them
    if (this.voices.length === 0 && this.synthesis) {
      this.voices = this.synthesis.getVoices();
    }
    return this.voices;
  }

  // Get English voices
  static getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => 
      voice.lang.startsWith('en') || voice.lang.includes('en')
    );
  }

  // Voice preference management
  private static VOICE_PREFERENCE_KEY = 'voiceAssistant_defaultVoice';

  // Save user's preferred voice to localStorage
  static saveDefaultVoice(voice: SpeechSynthesisVoice): void {
    try {
      const voiceData = {
        name: voice.name,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        savedAt: Date.now()
      };
      localStorage.setItem(this.VOICE_PREFERENCE_KEY, JSON.stringify(voiceData));
      console.log('Default voice saved:', voiceData);
    } catch (error) {
      console.error('Failed to save default voice preference:', error);
    }
  }

  // Get user's preferred voice from localStorage
  static getDefaultVoicePreference(): SpeechSynthesisVoice | null {
    try {
      const saved = localStorage.getItem(this.VOICE_PREFERENCE_KEY);
      if (!saved) return null;

      const voiceData = JSON.parse(saved);
      
      // Find the voice in the current voices list
      const voice = this.voices.find(v => 
        v.name === voiceData.name && 
        v.lang === voiceData.lang &&
        v.voiceURI === voiceData.voiceURI
      );

      if (voice) {
        console.log('Found saved default voice:', voice.name);
        return voice;
      } else {
        console.log('Saved voice not found in current voices, clearing preference');
        this.clearDefaultVoicePreference();
        return null;
      }
    } catch (error) {
      console.error('Failed to get default voice preference:', error);
      return null;
    }
  }

  // Clear saved voice preference
  static clearDefaultVoicePreference(): void {
    try {
      localStorage.removeItem(this.VOICE_PREFERENCE_KEY);
      console.log('Default voice preference cleared');
    } catch (error) {
      console.error('Failed to clear default voice preference:', error);
    }
  }

  // Get default voice (with user preference fallback)
  static getDefaultVoice(language: string = 'en-US'): SpeechSynthesisVoice | null {
    // First, try to get user's saved preference
    const userPreference = this.getDefaultVoicePreference();
    if (userPreference) {
      return userPreference;
    }

    // Fallback to automatic selection
    const englishVoices = this.getEnglishVoices();
    if (englishVoices.length === 0) return null;
    
    // Try to find a voice that matches the language
    const languageMatch = englishVoices.find(voice => voice.lang === language);
    if (languageMatch) return languageMatch;
    
    // Fallback to first English voice
    return englishVoices[0];
  }

  // Text-to-Speech
  static speak(
    text: string, 
    config: Partial<VoiceConfig> = {},
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply configuration
      const defaultConfig: VoiceConfig = {
        language: 'en-US',
        rate: 1,
        pitch: 1,
        volume: 1
      };

      const finalConfig = { ...defaultConfig, ...config };
      
      utterance.lang = finalConfig.language;
      utterance.rate = finalConfig.rate;
      utterance.pitch = finalConfig.pitch;
      utterance.volume = finalConfig.volume;

      if (finalConfig.voice) {
        utterance.voice = finalConfig.voice;
      }

      // Event handlers
      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        onError?.(event);
        reject(event);
      };

      this.synthesis.speak(utterance);
    });
  }

  // Stop speaking
  static stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Check if currently speaking
  static isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  // Speech-to-Text
  static startListening(
    config: Partial<VoiceRecognitionConfig> = {},
    onResult?: (transcript: string, isFinal: boolean) => void,
    onError?: (error: any) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    const defaultConfig: VoiceRecognitionConfig = {
      language: 'en-US',
      continuous: true,
      interimResults: true
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.recognition.lang = finalConfig.language;
    this.recognition.continuous = finalConfig.continuous;
    this.recognition.interimResults = finalConfig.interimResults;

    this.recognition.onstart = () => {
      this.isListening = true;
      onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult?.(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError?.(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  // Stop listening
  static stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Check if currently listening
  static isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Check browser support
  static checkSupport(): {
    speechSynthesis: boolean;
    speechRecognition: boolean;
    fullSupport: boolean;
  } {
    const speechSynthesis = 'speechSynthesis' in window;
    const speechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    return {
      speechSynthesis,
      speechRecognition,
      fullSupport: speechSynthesis && speechRecognition
    };
  }

  // Format AI response for speech (remove markdown, emojis, etc.)
  static formatForSpeech(text: string): string {
    return text
      // Remove emojis
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Code
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/^[-*+]\s/gm, '') // List items
      .replace(/^\d+\.\s/gm, '') // Numbered lists
      // Remove excessive whitespace
      .replace(/\n\s*\n/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Clean up resources
  static cleanup(): void {
    this.stopSpeaking();
    this.stopListening();
  }
}
