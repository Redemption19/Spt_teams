'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  CheckSquare, 
  FileText, 
  Calendar, 
  BarChart3, 
  Users 
} from 'lucide-react';
import AITaskActions from './ai-task-actions';
import AIReportActions from './ai-report-actions';
import AICalendarActions from './ai-calendar-actions';
import AIAnalyticsActions from './ai-analytics-actions';
import AIDepartmentActions from './ai-department-actions';

export default function AIPoweredActions() {
  const [activeTab, setActiveTab] = useState('tasks');

  const actionTabs = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: '3 suggestions',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: '2 insights',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: Calendar,
      badge: '4 actions',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: '1 anomaly',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    },
    {
      id: 'departments',
      label: 'Teams',
      icon: Users,
      badge: '2 recommendations',
      color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            AI-Powered Actions
          </CardTitle>
          <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-accent/20">
            Smart Suggestions
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          AI-generated recommendations and actions across your workspace
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pb-4">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              {actionTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary/10"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 ${tab.color} border-0`}
                    >
                      {tab.badge}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="border-t bg-muted/20">
            <TabsContent value="tasks" className="mt-0 p-6">
              <AITaskActions />
            </TabsContent>
            
            <TabsContent value="reports" className="mt-0 p-6">
              <AIReportActions />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0 p-6">
              <AICalendarActions />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-0 p-6">
              <AIAnalyticsActions />
            </TabsContent>
            
            <TabsContent value="departments" className="mt-0 p-6">
              <AIDepartmentActions />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
