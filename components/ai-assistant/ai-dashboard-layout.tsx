'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Brain, Zap } from 'lucide-react';
import AIAssistantMain from './ai-assistant-main';
import AIRecommendationCards from './recommendation-cards/ai-recommendation-cards';
import AIPoweredActions from './ai-actions/ai-powered-actions';

export default function AIDashboardLayout() {
  const [activeSection, setActiveSection] = useState<string>('chat');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Assistant Dashboard</h1>
                <p className="text-sm text-muted-foreground">Your intelligent workspace companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Badge variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                Real-time
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left Side - Chat Interface */}
          <div className="lg:col-span-2 relative">
            <Card className="h-full min-h-[600px] overflow-hidden">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Chat Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 h-[calc(100%-80px)]">
                <AIAssistantMain />
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Recommendation Cards */}
          <div className="lg:col-span-1 relative z-10">
            <div className="h-full min-h-[600px] sticky top-4">
              <AIRecommendationCards />
            </div>
          </div>
        </div>

        {/* Bottom Section - AI-Powered Actions */}
        <div className="mt-6">
          <AIPoweredActions />
        </div>
      </div>
    </div>
  );
}
