'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Square,
  Loader2,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceControls({
  isListening,
  isSpeaking,
  isSupported,
  transcript,
  interimTranscript,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  disabled = false,
  className
}: VoiceControlsProps) {
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-2", className)}>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <MicOff className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="text-xs">
                Voice not supported
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice features are not supported in this browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Microphone Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={isListening ? onStopListening : onStartListening}
              disabled={disabled || isSpeaking}
              className={cn(
                "relative transition-all duration-200",
                isListening && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              )}
            >
              {isListening ? (
                <>
                  <Waves className="h-4 w-4" />
                  <span className="ml-1 text-xs">Listening...</span>
                </>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? 'Stop listening' : 'Start voice input'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Speaker Button */}
      {isSpeaking && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onStopSpeaking}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Square className="h-4 w-4" />
                <span className="ml-1 text-xs">Stop</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop speaking</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Status Badges */}
      <div className="flex items-center gap-1">
        {isListening && (
          <Badge variant="default" className="bg-red-500 text-white text-xs animate-pulse">
            <Mic className="h-3 w-3 mr-1" />
            Listening
          </Badge>
        )}
        
        {isSpeaking && (
          <Badge variant="default" className="bg-blue-500 text-white text-xs">
            <Volume2 className="h-3 w-3 mr-1" />
            Speaking
          </Badge>
        )}
      </div>
    </div>
  );
}

interface VoiceTranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  className?: string;
}

export function VoiceTranscriptDisplay({
  transcript,
  interimTranscript,
  isListening,
  className
}: VoiceTranscriptDisplayProps) {
  if (!transcript && !interimTranscript && !isListening) {
    return null;
  }

  return (
    <div className={cn("p-3 bg-gray-50 rounded-lg border border-gray-200", className)}>
      <div className="flex items-start gap-2">
        <Mic className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-700">
            {transcript && (
              <span className="font-medium">{transcript}</span>
            )}
            {interimTranscript && (
              <span className="text-gray-500 italic">
                {transcript ? ' ' : ''}{interimTranscript}
              </span>
            )}
            {isListening && !transcript && !interimTranscript && (
              <span className="text-gray-400 italic animate-pulse">
                Listening for speech...
              </span>
            )}
            {isListening && (
              <span className="inline-block w-2 h-4 bg-red-500 ml-1 animate-blink" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VoiceStatusIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  className?: string;
}

export function VoiceStatusIndicator({
  isListening,
  isSpeaking,
  isSupported,
  className
}: VoiceStatusIndicatorProps) {
  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isListening && (
        <div className="flex items-center gap-1 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium">Recording</span>
        </div>
      )}
      
      {isSpeaking && (
        <div className="flex items-center gap-1 text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium">Speaking</span>
        </div>
      )}
    </div>
  );
}
