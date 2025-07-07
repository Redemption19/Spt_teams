'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  Volume2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Globe,
  Shield,
  Settings
} from 'lucide-react';
import { VoiceChatService } from '@/lib/voice-chat-service';

interface VoiceTroubleshootingProps {
  onClose?: () => void;
  onRetry?: () => void;
}

export function VoiceTroubleshooting({ onClose, onRetry }: VoiceTroubleshootingProps) {
  const [diagnostics, setDiagnostics] = React.useState<any>(null);

  React.useEffect(() => {
    const support = VoiceChatService.checkSupport();
    setDiagnostics(support);
  }, []);

  const handleTestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      alert('✅ Microphone access granted successfully!');
    } catch (error) {
      alert('❌ Microphone access failed. Please check your browser permissions.');
    }
  };

  if (!diagnostics) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Running diagnostics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Voice Chat Troubleshooting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Browser Support Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            {diagnostics.speechRecognition ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">Speech-to-Text</div>
              <div className="text-sm text-muted-foreground">
                {diagnostics.speechRecognition ? 'Supported' : 'Not Supported'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 border rounded-lg">
            {diagnostics.speechSynthesis ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">Text-to-Speech</div>
              <div className="text-sm text-muted-foreground">
                {diagnostics.speechSynthesis ? 'Supported' : 'Not Supported'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 border rounded-lg">
            {diagnostics.isSecureContext ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <div className="font-medium">Secure Context</div>
              <div className="text-sm text-muted-foreground">
                {diagnostics.isSecureContext ? 'HTTPS' : 'HTTP Only'}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <Alert>
          <AlertDescription>
            <div className="text-sm">
              <strong>Debug Info:</strong> {diagnostics.debugInfo}
            </div>
          </AlertDescription>
        </Alert>

        {/* Common Solutions */}
        <div className="space-y-3">
          <h4 className="font-medium">Common Solutions:</h4>
          
          {!diagnostics.isSecureContext && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Voice features require HTTPS. Make sure you&apos;re accessing the site via https://.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Mic className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <strong>Microphone Permission:</strong> Click the microphone icon in your browser&apos;s address bar and allow access.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Settings className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <strong>Browser Settings:</strong> Check your browser&apos;s microphone settings in Settings → Privacy &amp; Security.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <strong>Refresh Page:</strong> After granting permissions, refresh the page to apply changes.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button onClick={handleTestMicrophone} variant="outline" size="sm">
            <Mic className="h-4 w-4 mr-2" />
            Test Microphone
          </Button>
          
          {onRetry && (
            <Button onClick={onRetry} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Voice Chat
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
