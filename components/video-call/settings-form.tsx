'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Video, 
  Mic, 
  Bell, 
  Shield, 
  HardDrive,
  Save,
  RotateCcw,
  TestTube,
  Volume2,
  Camera,
  Monitor,
  Smartphone
} from 'lucide-react';
import { VideoCallSettings } from '@/lib/video-call-data-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const settingsSchema = z.object({
  general: z.object({
    defaultMeetingDuration: z.number().min(15).max(480),
    autoJoinAudio: z.boolean(),
    autoJoinVideo: z.boolean(),
    showParticipantNames: z.boolean(),
    enableWaitingRoom: z.boolean(),
    allowScreenShare: z.boolean(),
    enableChat: z.boolean(),
    enableRecording: z.boolean(),
  }),
  audio: z.object({
    inputDevice: z.string(),
    outputDevice: z.string(),
    inputVolume: z.number().min(0).max(100),
    outputVolume: z.number().min(0).max(100),
    echoCancellation: z.boolean(),
    noiseSuppression: z.boolean(),
    autoGainControl: z.boolean(),
    enableMicTest: z.boolean(),
  }),
  video: z.object({
    camera: z.string(),
    resolution: z.enum(['720p', '1080p', '4k']),
    frameRate: z.enum(['15', '30', '60']),
    enableHD: z.boolean(),
    mirrorVideo: z.boolean(),
    enableVirtualBackground: z.boolean(),
    enableBeautyFilter: z.boolean(),
    lowLightEnhancement: z.boolean(),
  }),
  notifications: z.object({
    meetingReminders: z.boolean(),
    participantJoined: z.boolean(),
    participantLeft: z.boolean(),
    chatMessages: z.boolean(),
    recordingStarted: z.boolean(),
    meetingEnded: z.boolean(),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
  }),
  security: z.object({
    requirePassword: z.boolean(),
    enableEndToEndEncryption: z.boolean(),
    allowGuestAccess: z.boolean(),
    requireAuthentication: z.boolean(),
    enableMeetingLock: z.boolean(),
    participantApproval: z.boolean(),
    recordingConsent: z.boolean(),
    dataRetentionDays: z.number().min(1).max(365),
  }),
  storage: z.object({
    autoDeleteRecordings: z.boolean(),
    recordingRetentionDays: z.number().min(1).max(365),
    maxRecordingSize: z.number().min(100).max(10000),
    cloudStorage: z.boolean(),
    localStorage: z.boolean(),
    compressionLevel: z.enum(['low', 'medium', 'high']),
    enableTranscription: z.boolean(),
    transcriptionLanguage: z.string(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: VideoCallSettings | null;
  loading?: boolean;
  onSave: (settings: VideoCallSettings) => Promise<void>;
  onTest?: (type: 'audio' | 'video') => void;
}

export function SettingsForm({
  settings,
  loading = false,
  onSave,
  onTest
}: SettingsFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  const getFormDefaultValues = (): SettingsFormData => {
    if (settings) {
      return {
        general: {
          defaultMeetingDuration: settings.general.defaultMeetingDuration,
          autoJoinAudio: true, // Map from settings if available
          autoJoinVideo: true, // Map from settings if available
          showParticipantNames: true, // Map from settings if available
          enableWaitingRoom: settings.general.waitingRoom,
          allowScreenShare: settings.general.enableScreenSharing,
          enableChat: settings.general.enableChat,
          enableRecording: settings.general.autoStartRecording,
        },
        audio: {
          inputDevice: settings.audio.defaultMicrophone || 'default',
          outputDevice: settings.audio.defaultSpeaker || 'default',
          inputVolume: settings.audio.microphoneVolume || 80,
          outputVolume: settings.audio.speakerVolume || 80,
          echoCancellation: settings.audio.echoCancellation,
          noiseSuppression: settings.audio.noiseSuppression,
          autoGainControl: settings.audio.autoGainControl,
          enableMicTest: false,
        },
        video: {
          camera: settings.video.defaultCamera || 'default',
          resolution: (() => {
             const res = settings.video.defaultResolution;
             if (res === '1920x1080') return '1080p' as const;
             if (res === '1280x720') return '720p' as const;
             if (res === '3840x2160') return '4k' as const;
             return '1080p' as const;
           })(),
          frameRate: settings.video.frameRate.toString() as '15' | '30' | '60',
          enableHD: settings.video.enableHD,
          mirrorVideo: settings.video.mirrorVideo,
          enableVirtualBackground: settings.general.enableVirtualBackground,
          enableBeautyFilter: false,
          lowLightEnhancement: false,
        },
        notifications: {
          meetingReminders: settings.notifications.meetingReminders,
          participantJoined: settings.notifications.participantJoined,
          participantLeft: settings.notifications.participantLeft,
          chatMessages: settings.notifications.chatMessages,
          recordingStarted: settings.notifications.recordingReady,
          meetingEnded: false,
          emailNotifications: settings.notifications.emailNotifications,
          pushNotifications: settings.notifications.browserNotifications,
        },
        security: {
          requirePassword: settings.security.requirePassword,
          enableEndToEndEncryption: settings.security.endToEndEncryption,
          allowGuestAccess: settings.security.allowAnonymousUsers,
          requireAuthentication: !settings.security.allowAnonymousUsers,
          enableMeetingLock: false,
          participantApproval: false,
          recordingConsent: settings.security.recordingConsent,
          dataRetentionDays: settings.security.dataRetentionDays,
        },
        storage: {
          autoDeleteRecordings: settings.storage.autoDeleteRecordings,
          recordingRetentionDays: settings.storage.recordingRetentionDays,
          maxRecordingSize: settings.storage.maxStoragePerUser || 1000,
          cloudStorage: settings.storage.cloudStorage,
          localStorage: settings.storage.localDownloads,
          compressionLevel: (settings.storage.compressionLevel === 'low' || 
                           settings.storage.compressionLevel === 'medium' || 
                           settings.storage.compressionLevel === 'high' ? 
                           settings.storage.compressionLevel : 'medium') as 'low' | 'medium' | 'high',
          enableTranscription: false,
          transcriptionLanguage: 'en',
        },
      };
    }
    return {
      general: {
        defaultMeetingDuration: 60,
        autoJoinAudio: true,
        autoJoinVideo: true,
        showParticipantNames: true,
        enableWaitingRoom: false,
        allowScreenShare: true,
        enableChat: true,
        enableRecording: false,
      },
      audio: {
        inputDevice: 'default',
        outputDevice: 'default',
        inputVolume: 80,
        outputVolume: 80,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        enableMicTest: false,
      },
      video: {
        camera: 'default',
        resolution: '1080p',
        frameRate: '30' as '15' | '30' | '60',
        enableHD: true,
        mirrorVideo: true,
        enableVirtualBackground: false,
        enableBeautyFilter: false,
        lowLightEnhancement: false,
      },
      notifications: {
        meetingReminders: true,
        participantJoined: false,
        participantLeft: false,
        chatMessages: true,
        recordingStarted: true,
        meetingEnded: false,
        emailNotifications: true,
        pushNotifications: true,
      },
      security: {
        requirePassword: false,
        enableEndToEndEncryption: true,
        allowGuestAccess: true,
        requireAuthentication: false,
        enableMeetingLock: false,
        participantApproval: false,
        recordingConsent: true,
        dataRetentionDays: 90,
      },
      storage: {
        autoDeleteRecordings: true,
        recordingRetentionDays: 30,
        maxRecordingSize: 1000,
        cloudStorage: true,
        localStorage: false,
        compressionLevel: 'medium' as 'low' | 'medium' | 'high',
        enableTranscription: false,
        transcriptionLanguage: 'en',
      },
    };
  };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: getFormDefaultValues(),
  });

  useEffect(() => {
    if (settings) {
      form.reset(getFormDefaultValues());
    }
  }, [settings, form]);

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSave = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      // Convert form data back to VideoCallSettings format
      const settingsData: VideoCallSettings = {
        workspaceId: settings?.workspaceId || '',
        userId: settings?.userId,
        general: {
          defaultMeetingDuration: data.general.defaultMeetingDuration,
          maxParticipants: settings?.general.maxParticipants || 50,
          autoStartRecording: data.general.enableRecording,
          enableChat: data.general.enableChat,
          enableScreenSharing: data.general.allowScreenShare,
          enableVirtualBackground: data.video.enableVirtualBackground,
          defaultMeetingPassword: data.security.requirePassword,
          waitingRoom: data.general.enableWaitingRoom,
          muteParticipantsOnJoin: settings?.general.muteParticipantsOnJoin || false,
          disableCameraOnJoin: settings?.general.disableCameraOnJoin || false,
        },
        audio: {
          defaultMicrophone: data.audio.inputDevice,
          defaultSpeaker: data.audio.outputDevice,
          echoCancellation: data.audio.echoCancellation,
          noiseSuppression: data.audio.noiseSuppression,
          autoGainControl: data.audio.autoGainControl,
          microphoneVolume: data.audio.inputVolume,
          speakerVolume: data.audio.outputVolume,
        },
        video: {
          defaultCamera: data.video.camera,
          defaultResolution: data.video.resolution === '1080p' ? '1920x1080' : 
                           data.video.resolution === '720p' ? '1280x720' : 
                           data.video.resolution === '4k' ? '3840x2160' : '1920x1080',
          frameRate: parseInt(data.video.frameRate),
          enableHD: data.video.enableHD,
          mirrorVideo: data.video.mirrorVideo,
          virtualBackgroundBlur: settings?.video.virtualBackgroundBlur || false,
        },
        notifications: {
          emailNotifications: data.notifications.emailNotifications,
          browserNotifications: data.notifications.pushNotifications,
          mobileNotifications: settings?.notifications.mobileNotifications || false,
          meetingReminders: data.notifications.meetingReminders,
          recordingReady: data.notifications.recordingStarted,
          participantJoined: data.notifications.participantJoined,
          participantLeft: data.notifications.participantLeft,
          chatMessages: data.notifications.chatMessages,
        },
        security: {
          requirePassword: data.security.requirePassword,
          enableWaitingRoom: data.general.enableWaitingRoom,
          allowAnonymousUsers: data.security.allowGuestAccess,
          recordingConsent: data.security.recordingConsent,
          endToEndEncryption: data.security.enableEndToEndEncryption,
          dataRetentionDays: data.security.dataRetentionDays,
          allowExternalParticipants: settings?.security.allowExternalParticipants || true,
        },
        storage: {
          autoDeleteRecordings: data.storage.autoDeleteRecordings,
          recordingRetentionDays: data.storage.recordingRetentionDays,
          maxStoragePerUser: data.storage.maxRecordingSize,
          compressionLevel: data.storage.compressionLevel,
          cloudStorage: data.storage.cloudStorage,
          localDownloads: data.storage.localStorage,
        },
        createdAt: settings?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      await onSave(settingsData);
      setHasChanges(false);
      toast({
        title: 'Settings saved',
        description: 'Your video call settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      form.reset(getFormDefaultValues());
      setHasChanges(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-64 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Video Call Settings</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Configure your video call preferences</p>
        </div>
        {hasChanges && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs sm:text-sm w-fit">
            Unsaved changes
          </Badge>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
        {/* Navigation */}
        <div className="xl:w-64">
          <nav className="flex xl:flex-col gap-1 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2 text-left rounded-md transition-colors whitespace-nowrap xl:w-full min-h-[44px] touch-manipulation ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              {/* General Settings */}
              {activeSection === 'general' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      General Settings
                    </CardTitle>
                    <CardDescription>
                      Configure basic meeting preferences and default behaviors
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="general.defaultMeetingDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Meeting Duration (minutes)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={15}
                                max={480}
                                step={15}
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>15 min</span>
                                <span className="font-medium">{field.value} minutes</span>
                                <span>8 hours</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="general.autoJoinAudio"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4">
                            <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                              <FormLabel className="text-sm sm:text-base">Auto-join Audio</FormLabel>
                              <FormDescription className="text-xs sm:text-sm">
                                Automatically join with audio enabled
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="general.autoJoinVideo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm sm:text-base">Auto-join Video</FormLabel>
                              <FormDescription className="text-xs sm:text-sm">
                                Automatically join with video enabled
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="general.enableWaitingRoom"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm sm:text-base">Waiting Room</FormLabel>
                              <FormDescription className="text-xs sm:text-sm">
                                Require host approval to join
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="general.allowScreenShare"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm sm:text-base">Screen Sharing</FormLabel>
                              <FormDescription className="text-xs sm:text-sm">
                                Allow participants to share screens
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audio Settings */}
              {activeSection === 'audio' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5" />
                      Audio Settings
                    </CardTitle>
                    <CardDescription>
                      Configure microphone, speakers, and audio processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="audio.inputDevice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Microphone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select microphone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default Microphone</SelectItem>
                                <SelectItem value="built-in">Built-in Microphone</SelectItem>
                                <SelectItem value="external">External Microphone</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="audio.outputDevice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speakers</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select speakers" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default Speakers</SelectItem>
                                <SelectItem value="built-in">Built-in Speakers</SelectItem>
                                <SelectItem value="headphones">Headphones</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="audio.inputVolume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mic className="h-4 w-4" />
                              Microphone Volume
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  min={0}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>0%</span>
                                  <span className="font-medium">{field.value}%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="audio.outputVolume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Volume2 className="h-4 w-4" />
                              Speaker Volume
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Slider
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  min={0}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>0%</span>
                                  <span className="font-medium">{field.value}%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {onTest && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onTest('audio')}
                          className="flex items-center gap-2"
                        >
                          <TestTube className="h-4 w-4" />
                          Test Audio
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Video Settings */}
              {activeSection === 'video' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Video Settings
                    </CardTitle>
                    <CardDescription>
                      Configure camera, resolution, and video effects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="video.camera"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Camera</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select camera" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default Camera</SelectItem>
                                <SelectItem value="built-in">Built-in Camera</SelectItem>
                                <SelectItem value="external">External Camera</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="video.resolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resolution</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select resolution" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="720p">720p (HD)</SelectItem>
                                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                                <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="video.frameRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frame Rate</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frame rate" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="15">15 FPS</SelectItem>
                                <SelectItem value="30">30 FPS</SelectItem>
                                <SelectItem value="60">60 FPS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {onTest && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onTest('video')}
                          className="flex items-center gap-2"
                        >
                          <TestTube className="h-4 w-4" />
                          Test Camera
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Changes
                </Button>
                <Button
                  type="submit"
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}