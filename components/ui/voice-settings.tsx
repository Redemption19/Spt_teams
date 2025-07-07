'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw,
  Mic,
  Speaker,
  Settings
} from 'lucide-react';
import { VoiceChatService } from '@/lib/voice-chat-service';
import { useToast } from '@/hooks/use-toast';

interface VoiceSettingsProps {
  currentVoice: SpeechSynthesisVoice | null;
  onVoiceChange: (voice: SpeechSynthesisVoice | null) => void;
  onConfigChange: (config: {
    rate?: number;
    pitch?: number;
    volume?: number;
  }) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function VoiceSettings({ 
  currentVoice, 
  onVoiceChange, 
  onConfigChange,
  isOpen = true,
  onClose 
}: VoiceSettingsProps) {
  const { toast } = useToast();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(currentVoice);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = VoiceChatService.getVoices();
      setVoices(availableVoices);
      
      // If no voice is selected, use default
      if (!selectedVoice && availableVoices.length > 0) {
        const defaultVoice = VoiceChatService.getDefaultVoice();
        setSelectedVoice(defaultVoice);
        onVoiceChange(defaultVoice);
      }
    };

    loadVoices();

    // Handle voices loading asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice, onVoiceChange]);

  // Test voice with sample text
  const testVoice = async () => {
    if (!selectedVoice) return;

    const sampleTexts = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "This is how I sound when reading your messages aloud.",
      "You can adjust my voice settings to your preference.",
      "Thank you for testing my voice capabilities!"
    ];

    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

    try {
      setIsPlaying(true);
      await VoiceChatService.speak(
        randomText,
        {
          voice: selectedVoice,
          rate,
          pitch,
          volume,
          language: selectedVoice.lang
        },
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        (error) => {
          setIsPlaying(false);
          toast({
            title: '🔊 Voice Test Error',
            description: 'Failed to play voice sample. Please try again.',
            variant: 'destructive',
          });
        }
      );
    } catch (error) {
      setIsPlaying(false);
      console.error('Voice test error:', error);
    }
  };

  const stopVoice = () => {
    VoiceChatService.stopSpeaking();
    setIsPlaying(false);
  };

  const handleVoiceChange = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName) || null;
    setSelectedVoice(voice);
    onVoiceChange(voice);
  };

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    onConfigChange({ rate: newRate });
  };

  const handlePitchChange = (value: number[]) => {
    const newPitch = value[0];
    setPitch(newPitch);
    onConfigChange({ pitch: newPitch });
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    onConfigChange({ volume: newVolume });
  };

  const resetToDefaults = () => {
    setRate(1.0);
    setPitch(1.0);
    setVolume(1.0);
    onConfigChange({ rate: 1.0, pitch: 1.0, volume: 1.0 });
    
    const defaultVoice = VoiceChatService.getDefaultVoice();
    setSelectedVoice(defaultVoice);
    onVoiceChange(defaultVoice);

    toast({
      title: '🔄 Settings Reset',
      description: 'Voice settings have been reset to defaults.',
    });
  };

  // Group voices by language for better organization
  const groupedVoices = voices.reduce((groups, voice) => {
    const language = voice.lang.split('-')[0].toUpperCase();
    if (!groups[language]) {
      groups[language] = [];
    }
    groups[language].push(voice);
    return groups;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  // Prioritize English voices
  const sortedLanguages = Object.keys(groupedVoices).sort((a, b) => {
    if (a === 'EN') return -1;
    if (b === 'EN') return 1;
    return a.localeCompare(b);
  });

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Speaker className="h-5 w-5" />
            AI Voice Settings
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Voice Selection</Label>
          <Select 
            value={selectedVoice?.name || ''} 
            onValueChange={handleVoiceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a voice for the AI assistant" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {sortedLanguages.map((language) => (
                <div key={language}>
                  <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                    {language === 'EN' ? 'English' : language} Voices
                  </div>
                  {groupedVoices[language].map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{voice.name}</span>
                        <div className="flex gap-1 ml-2">
                          {voice.default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                          {voice.localService && (
                            <Badge variant="outline" className="text-xs">Local</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <Separator className="my-1" />
                </div>
              ))}
            </SelectContent>
          </Select>
          {selectedVoice && (
            <div className="text-sm text-muted-foreground">
              Language: {selectedVoice.lang} • 
              {selectedVoice.localService ? ' Local Voice' : ' Network Voice'}
            </div>
          )}
        </div>

        {/* Voice Test */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Voice Test</Label>
          <div className="flex gap-2">
            <Button 
              onClick={testVoice} 
              disabled={!selectedVoice || isPlaying}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isPlaying ? 'Playing...' : 'Test Voice'}
            </Button>
            {isPlaying && (
              <Button onClick={stopVoice} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Voice Configuration */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Voice Configuration</Label>
          
          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Speech Rate</Label>
              <span className="text-sm text-muted-foreground">{rate.toFixed(1)}x</span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={handleRateChange}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Pitch</Label>
              <span className="text-sm text-muted-foreground">{pitch.toFixed(1)}</span>
            </div>
            <Slider
              value={[pitch]}
              onValueChange={handlePitchChange}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lower</span>
              <span>Higher</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Volume</Label>
              <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Quiet</span>
              <span>Loud</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={resetToDefaults} variant="outline" className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1">
              Save Settings
            </Button>
          )}
        </div>

        {/* Quick Tips */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">💡 Quick Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Test different voices to find one you prefer</li>
            <li>• Adjust speech rate for comfortable listening</li>
            <li>• Lower pitch for more authoritative responses</li>
            <li>• Local voices work offline and are more responsive</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
