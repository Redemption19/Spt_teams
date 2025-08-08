'use client';

import { useVideoCallSettings } from '@/hooks/use-video-call-data';
import { SettingsForm } from '@/components/video-call/settings-form';
import { useToast } from '@/hooks/use-toast';
import { VideoCallSettings } from '@/lib/video-call-data-service';

export default function VideoCallSettingsPage() {
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useVideoCallSettings();

  const handleSaveSettings = async (newSettings: VideoCallSettings) => {
    try {
      await updateSettings(newSettings);
      toast({
        title: 'Settings Saved',
        description: 'Your video call settings have been updated successfully.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
      throw error; // Re-throw to let the form handle the error state
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Video Call Settings</h1>
        <p className="text-muted-foreground">
          Configure your video calling preferences and defaults
        </p>
      </div>

      <SettingsForm
        settings={settings}
        loading={loading}
        onSave={handleSaveSettings}
      />
    </div>
  );
}