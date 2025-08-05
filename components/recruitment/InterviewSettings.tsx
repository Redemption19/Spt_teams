'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  X, 
  Mic, 
  Video, 
  Monitor,
  Volume2,
  Wifi,
  Shield,
  Palette,
  Zap
} from 'lucide-react';

interface InterviewSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: InterviewSettings) => void;
  currentSettings?: InterviewSettings;
}

export interface InterviewSettings {
  // Audio Settings
  microphoneDevice: string;
  speakerDevice: string;
  microphoneVolume: number;
  speakerVolume: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;

  // Video Settings
  cameraDevice: string;
  videoQuality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: number;
  resolution: string;
  mirrorVideo: boolean;

  // Network Settings
  bandwidthLimit: number;
  enableAdaptiveBitrate: boolean;
  enableNetworkOptimization: boolean;

  // Interface Settings
  showParticipantNames: boolean;
  showConnectionQuality: boolean;
  enableKeyboardShortcuts: boolean;
  autoMuteOnJoin: boolean;
  autoCameraOffOnJoin: boolean;

  // Accessibility
  enableCaptions: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
}

const defaultSettings: InterviewSettings = {
  // Audio Settings
  microphoneDevice: '',
  speakerDevice: '',
  microphoneVolume: 100,
  speakerVolume: 100,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,

  // Video Settings
  cameraDevice: '',
  videoQuality: 'high',
  frameRate: 30,
  resolution: '1280x720',
  mirrorVideo: true,

  // Network Settings
  bandwidthLimit: 2000,
  enableAdaptiveBitrate: true,
  enableNetworkOptimization: true,

  // Interface Settings
  showParticipantNames: true,
  showConnectionQuality: true,
  enableKeyboardShortcuts: true,
  autoMuteOnJoin: false,
  autoCameraOffOnJoin: false,

  // Accessibility
  enableCaptions: false,
  highContrastMode: false,
  reduceMotion: false,
};

export default function InterviewSettings({
  isOpen,
  onClose,
  onSettingsChange,
  currentSettings = defaultSettings
}: InterviewSettingsProps) {
  const [settings, setSettings] = useState<InterviewSettings>(currentSettings);
  const [availableDevices, setAvailableDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: []
  });

  // Load available devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableDevices({
          audioInputs: devices.filter(device => device.kind === 'audioinput'),
          audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
          videoInputs: devices.filter(device => device.kind === 'videoinput')
        });
      } catch (error) {
        console.error('Error loading devices:', error);
      }
    };

    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const handleSettingChange = (key: keyof InterviewSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed right-4 bottom-20 w-96 max-h-[80vh] z-50 shadow-lg border-2 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <CardTitle className="text-sm">Call Settings</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full overflow-y-auto">
        <div className="space-y-6 p-4">
          {/* Audio Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <h3 className="font-medium text-sm">Audio</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Microphone</Label>
                <Select
                  value={settings.microphoneDevice}
                  onValueChange={(value) => handleSettingChange('microphoneDevice', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDevices.audioInputs.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Microphone Volume</Label>
                <Slider
                  value={[settings.microphoneVolume]}
                  onValueChange={([value]) => handleSettingChange('microphoneVolume', value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {settings.microphoneVolume}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Echo Cancellation</Label>
                  <Switch
                    checked={settings.echoCancellation}
                    onCheckedChange={(checked) => handleSettingChange('echoCancellation', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Noise Suppression</Label>
                  <Switch
                    checked={settings.noiseSuppression}
                    onCheckedChange={(checked) => handleSettingChange('noiseSuppression', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Video Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <h3 className="font-medium text-sm">Video</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Camera</Label>
                <Select
                  value={settings.cameraDevice}
                  onValueChange={(value) => handleSettingChange('cameraDevice', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDevices.videoInputs.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Video Quality</Label>
                <Select
                  value={settings.videoQuality}
                  onValueChange={(value: any) => handleSettingChange('videoQuality', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (480p)</SelectItem>
                    <SelectItem value="medium">Medium (720p)</SelectItem>
                    <SelectItem value="high">High (1080p)</SelectItem>
                    <SelectItem value="ultra">Ultra (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Mirror Video</Label>
                <Switch
                  checked={settings.mirrorVideo}
                  onCheckedChange={(checked) => handleSettingChange('mirrorVideo', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Network Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <h3 className="font-medium text-sm">Network</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Bandwidth Limit (kbps)</Label>
                <Slider
                  value={[settings.bandwidthLimit]}
                  onValueChange={([value]) => handleSettingChange('bandwidthLimit', value)}
                  max={5000}
                  min={500}
                  step={100}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {settings.bandwidthLimit} kbps
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Adaptive Bitrate</Label>
                <Switch
                  checked={settings.enableAdaptiveBitrate}
                  onCheckedChange={(checked) => handleSettingChange('enableAdaptiveBitrate', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Interface Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <h3 className="font-medium text-sm">Interface</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Participant Names</Label>
                <Switch
                  checked={settings.showParticipantNames}
                  onCheckedChange={(checked) => handleSettingChange('showParticipantNames', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Connection Quality</Label>
                <Switch
                  checked={settings.showConnectionQuality}
                  onCheckedChange={(checked) => handleSettingChange('showConnectionQuality', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Keyboard Shortcuts</Label>
                <Switch
                  checked={settings.enableKeyboardShortcuts}
                  onCheckedChange={(checked) => handleSettingChange('enableKeyboardShortcuts', checked)}
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 