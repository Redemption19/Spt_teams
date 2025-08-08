'use client';

import { Bot, Brain, Lightbulb, TrendingUp, FileText, Users, Calendar, BarChart3, Zap, Target, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AIAssistantPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          AI Assistant
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Harness the power of artificial intelligence to optimize workflows, gain insights, and boost productivity across your organization.
        </p>
      </div>

      {/* AI Features Overview */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          AI-Powered Features
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent workflow and process optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Task prioritization</li>
                <li>• Resource allocation</li>
                <li>• Process improvements</li>
                <li>• Team collaboration tips</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Document Intelligence
              </CardTitle>
              <CardDescription>
                AI-powered document analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Content summarization</li>
                <li>• Key information extraction</li>
                <li>• Document categorization</li>
                <li>• Compliance checking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                Forecast trends and anticipate business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Performance forecasting</li>
                <li>• Resource demand prediction</li>
                <li>• Risk assessment</li>
                <li>• Growth opportunities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                Conversational AI
              </CardTitle>
              <CardDescription>
                Natural language interface for queries and commands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Natural language queries</li>
                <li>• Voice commands</li>
                <li>• Contextual responses</li>
                <li>• Multi-language support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Automation Engine
              </CardTitle>
              <CardDescription>
                Intelligent task and workflow automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Smart scheduling</li>
                <li>• Automated reporting</li>
                <li>• Workflow triggers</li>
                <li>• Decision automation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Performance Insights
              </CardTitle>
              <CardDescription>
                AI-driven performance analysis and optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Team productivity analysis</li>
                <li>• Bottleneck identification</li>
                <li>• Efficiency recommendations</li>
                <li>• Goal tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* AI Integration Across Modules */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 AI Integration Across Modules</h2>
        <p className="text-muted-foreground">
          Our AI assistant seamlessly integrates with all SPT Teams modules to provide contextual intelligence and automation.
        </p>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                HR & Team Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">AI-Powered HR Features:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Resume screening and candidate matching</li>
                  <li>• Performance review insights</li>
                  <li>• Employee satisfaction analysis</li>
                  <li>• Training recommendations</li>
                  <li>• Workload balancing suggestions</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/hr-management">
                  Explore HR AI Features
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Financial Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Smart Financial Features:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Expense categorization and anomaly detection</li>
                  <li>• Budget optimization recommendations</li>
                  <li>• Cash flow forecasting</li>
                  <li>• Invoice processing automation</li>
                  <li>• Financial risk assessment</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/financial-management">
                  Explore Financial AI
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Smart Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Intelligent Calendar Features:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Optimal meeting time suggestions</li>
                  <li>• Conflict resolution and rescheduling</li>
                  <li>• Task deadline optimization</li>
                  <li>• Resource availability prediction</li>
                  <li>• Meeting preparation assistance</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/calendar-tasks">
                  Explore Calendar AI
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Document Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Smart Document Features:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Automatic document classification</li>
                  <li>• Content extraction and indexing</li>
                  <li>• Version control recommendations</li>
                  <li>• Collaboration insights</li>
                  <li>• Compliance monitoring</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/document-management">
                  Explore Document AI
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Getting Started with AI */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🚀 Getting Started with AI Assistant</h2>
        
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            The AI Assistant learns from your organization&pos;s patterns and preferences to provide increasingly personalized recommendations.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Setup & Configuration</CardTitle>
              <CardDescription>
                Configure AI settings for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Initial Setup Steps:</h4>
                <ol className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>1. Enable AI features in workspace settings</li>
                  <li>2. Configure data access permissions</li>
                  <li>3. Set up notification preferences</li>
                  <li>4. Train AI with your organization&pos;s data</li>
                  <li>5. Customize recommendation thresholds</li>
                </ol>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/getting-started#ai-setup">
                  Setup Guide
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>
                Maximize AI effectiveness in your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Optimization Tips:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Provide feedback on AI recommendations</li>
                  <li>• Keep data clean and well-organized</li>
                  <li>• Use consistent naming conventions</li>
                  <li>• Regularly review AI insights</li>
                  <li>• Train team members on AI features</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* AI Privacy & Security */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔒 AI Privacy & Security</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Data Protection & Privacy</CardTitle>
            <CardDescription>
              How we protect your data while providing AI insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Privacy Measures</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• End-to-end encryption</li>
                  <li>• Data anonymization</li>
                  <li>• Local processing options</li>
                  <li>• GDPR compliance</li>
                  <li>• Audit trails</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Security Controls</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Role-based AI access</li>
                  <li>• Data retention policies</li>
                  <li>• Secure model training</li>
                  <li>• Regular security audits</li>
                  <li>• Incident response protocols</li>
                </ul>
              </div>
            </div>
            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/docs/security#ai-security">
                  Learn More About AI Security
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-2xl font-bold">🎯 Next Steps</h2>
        <p className="text-muted-foreground">
          Ready to harness the power of AI in your workspace? Here&pos;s how to get started:
        </p>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <Badge variant="secondary">Step 1</Badge>
            <h4 className="font-medium">Enable AI Features</h4>
            <p className="text-sm text-muted-foreground">
              Activate AI capabilities in your workspace settings and configure initial preferences.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Step 2</Badge>
            <h4 className="font-medium">Explore Recommendations</h4>
            <p className="text-sm text-muted-foreground">
              Start receiving AI-powered insights and recommendations across your workflows.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Step 3</Badge>
            <h4 className="font-medium">Optimize & Scale</h4>
            <p className="text-sm text-muted-foreground">
              Fine-tune AI settings and expand usage across your organization for maximum impact.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/getting-started">
              <Settings className="mr-2 h-4 w-4" />
              Setup AI Assistant
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/security">
              Learn About AI Security
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}