'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Settings } from 'lucide-react';
import { useWorkspaceAssistant } from './assistant-provider';

export default function AssistantSettings() {
  const { isEnabled, setIsEnabled, isVisible, setIsVisible } = useWorkspaceAssistant();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span>Workspace Assistant</span>
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure your AI-powered workspace assistant settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable Assistant</div>
            <div className="text-xs text-muted-foreground">
              Turn on/off the AI assistant functionality
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Show Floating Button</div>
            <div className="text-xs text-muted-foreground">
              Display the floating assistant button on all pages
            </div>
          </div>
          <Switch
            checked={isVisible}
            onCheckedChange={setIsVisible}
            disabled={!isEnabled}
          />
        </div>

        <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          💡 The assistant uses Gemini AI to provide contextual help based on your current workspace and role.
        </div>
      </CardContent>
    </Card>
  );
}
