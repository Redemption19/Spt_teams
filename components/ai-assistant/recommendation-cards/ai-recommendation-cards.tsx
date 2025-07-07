'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';
import WorkflowRecommendations from './workflow-recommendations';
import ProductivityInsights from './productivity-insights';

interface RecommendationItem {
  id: string;
  type: 'workflow' | 'productivity' | 'system';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: any;
  actionable: boolean;
  estimatedTime?: string;
}

export default function AIRecommendationCards() {
  const [activeCard, setActiveCard] = useState<'workflow' | 'productivity'>('workflow');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshRecommendations = async () => {
    setIsLoading(true);
    // Trigger refresh in child components
    setRefreshTrigger(prev => prev + 1);
    // Simulate minimum loading time for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  return (
    <div className="space-y-4 h-full relative">
      {/* Card Navigation */}
      <div className="flex gap-2 relative z-20">
        <Button
          variant={activeCard === 'workflow' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCard('workflow')}
          className="flex-1"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Workflow
        </Button>
        <Button
          variant={activeCard === 'productivity' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCard('productivity')}
          className="flex-1"
        >
          <Target className="h-4 w-4 mr-2" />
          Productivity
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshRecommendations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Workflow Recommendations Card */}
      {activeCard === 'workflow' && (
        <Card className="flex-1 relative z-10 bg-background border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Workflow Insights
              </div>
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <WorkflowRecommendations key={`workflow-${refreshTrigger}`} />
          </CardContent>
        </Card>
      )}

      {/* Productivity Insights Card */}
      {activeCard === 'productivity' && (
        <Card className="flex-1 relative z-10 bg-background border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Productivity Analytics
              </div>
              <Badge variant="secondary" className="text-xs">
                AI-Generated
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ProductivityInsights key={`productivity-${refreshTrigger}`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
