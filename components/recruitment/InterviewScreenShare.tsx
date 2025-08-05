'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  MonitorOff, 
  X, 
  Maximize2,
  Minimize2,
  ScreenShare,
  MonitorSmartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterviewScreenShareProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSharing?: (stream: MediaStream) => void;
  onStopSharing?: () => void;
  isSharing?: boolean;
  sharedStream?: MediaStream | null;
}

export default function InterviewScreenShare({
  isOpen,
  onClose,
  onStartSharing,
  onStopSharing,
  isSharing = false,
  sharedStream = null
}: InterviewScreenShareProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareType, setShareType] = useState<'screen' | 'window' | 'tab'>('screen');
  const [availableSources, setAvailableSources] = useState<MediaStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle shared stream display
  useEffect(() => {
    if (videoRef.current && sharedStream) {
      videoRef.current.srcObject = sharedStream;
    }
  }, [sharedStream]);

  const handleStartSharing = async () => {
    if (!onStartSharing) return;

    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      onStartSharing(stream);
    } catch (error) {
      console.error('Error starting screen share:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSharing = () => {
    if (onStopSharing) {
      onStopSharing();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <Card className={cn(
      "fixed z-50 shadow-lg border-2",
      isFullscreen 
        ? "inset-4 bg-background" 
        : "right-4 bottom-20 w-96 h-64"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScreenShare className="w-4 h-4" />
            <CardTitle className="text-sm">Screen Share</CardTitle>
            {isSharing && (
              <Badge variant="destructive" className="text-xs">
                LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-6 w-6 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex flex-col">
        {!isSharing ? (
          // Share Options
          <div className="flex-1 p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Type</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={shareType === 'screen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShareType('screen')}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs">Screen</span>
                </Button>
                <Button
                  variant={shareType === 'window' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShareType('window')}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs">Window</span>
                </Button>
                <Button
                  variant={shareType === 'tab' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShareType('tab')}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <MonitorSmartphone className="w-4 h-4" />
                  <span className="text-xs">Tab</span>
                </Button>
              </div>
            </div>

            <Button
              onClick={handleStartSharing}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Starting Share...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ScreenShare className="w-4 h-4" />
                  Start Sharing
                </div>
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              Share your screen, window, or browser tab with the interview participants
            </div>
          </div>
        ) : (
          // Shared Content Display
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-contain bg-black rounded-b-lg"
            />
            
            {/* Overlay Controls */}
            <div className="absolute bottom-2 right-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopSharing}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <MonitorOff className="w-4 h-4 mr-1" />
                Stop Sharing
              </Button>
            </div>

            {/* Share Indicator */}
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="bg-black/50 text-white border-0">
                <ScreenShare className="w-3 h-3 mr-1" />
                Sharing
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 