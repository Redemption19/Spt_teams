import { Bot, MessageSquare, Lightbulb, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get intelligent assistance with your workspace management and productivity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Chat Assistant</span>
            </CardTitle>
            <CardDescription>
              Get instant answers to your workspace questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Conversation</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Smart Suggestions</span>
            </CardTitle>
            <CardDescription>
              AI-powered recommendations for workflow optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">View Suggestions</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Automation</span>
            </CardTitle>
            <CardDescription>
              Set up intelligent automation for repetitive tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Configure</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Features</CardTitle>
          <CardDescription>Coming soon...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <Bot className="h-12 w-12 mr-4" />
            <div>
              <p className="text-lg font-medium">AI Assistant is being developed</p>
              <p className="text-sm">Intelligent features will be available soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
