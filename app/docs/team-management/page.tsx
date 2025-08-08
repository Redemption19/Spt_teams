'use client';

import { Users, UserPlus, MessageSquare, Target, BarChart3, Settings, Calendar, FileText, Award, Shield, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function TeamManagementPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Team Management
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Create, organize, and manage high-performing teams with advanced collaboration tools, performance tracking, and intelligent workflow automation.
        </p>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Core Team Features
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Team Creation
              </CardTitle>
              <CardDescription>
                Build and structure teams with flexible hierarchies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Flexible team structures</li>
                <li>• Role-based permissions</li>
                <li>• Cross-functional teams</li>
                <li>• Team templates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Collaboration Tools
              </CardTitle>
              <CardDescription>
                Real-time communication and collaboration features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Team chat and messaging</li>
                <li>• Video conferencing</li>
                <li>• Shared workspaces</li>
                <li>• File sharing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Goal Management
              </CardTitle>
              <CardDescription>
                Set, track, and achieve team objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• OKR framework support</li>
                <li>• Goal cascading</li>
                <li>• Progress tracking</li>
                <li>• Achievement recognition</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Data-driven insights into team performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Team productivity metrics</li>
                <li>• Collaboration analytics</li>
                <li>• Performance dashboards</li>
                <li>• Trend analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-500" />
                Resource Planning
              </CardTitle>
              <CardDescription>
                Optimize team resources and capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Capacity planning</li>
                <li>• Workload balancing</li>
                <li>• Resource allocation</li>
                <li>• Timeline management</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-500" />
                Workflow Automation
              </CardTitle>
              <CardDescription>
                Streamline team processes with automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Automated task assignment</li>
                <li>• Workflow templates</li>
                <li>• Approval processes</li>
                <li>• Integration triggers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Detailed Guide */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Team Management Guide
        </h2>
        
        <Tabs defaultValue="team-setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="team-setup">Team Setup</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team-setup" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Creating Teams
                  </CardTitle>
                  <CardDescription>
                    Build effective team structures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Define team purpose and objectives</li>
                    <li>• Set up team hierarchy and roles</li>
                    <li>• Configure team permissions</li>
                    <li>• Add team members and assign roles</li>
                    <li>• Create team workspace</li>
                    <li>• Set up communication channels</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize team settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Team visibility and privacy settings</li>
                    <li>• Notification preferences</li>
                    <li>• Integration configurations</li>
                    <li>• Custom fields and metadata</li>
                    <li>• Workflow templates</li>
                    <li>• Access control policies</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="collaboration" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Communication
                  </CardTitle>
                  <CardDescription>
                    Foster effective team communication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time team chat and messaging</li>
                    <li>• Video calls and screen sharing</li>
                    <li>• Discussion threads and forums</li>
                    <li>• @mentions and notifications</li>
                    <li>• File sharing and collaboration</li>
                    <li>• Meeting scheduling and notes</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Shared Workspaces
                  </CardTitle>
                  <CardDescription>
                    Collaborative document and project spaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Shared document libraries</li>
                    <li>• Real-time collaborative editing</li>
                    <li>• Version control and history</li>
                    <li>• Project boards and kanban</li>
                    <li>• Knowledge base creation</li>
                    <li>• Template libraries</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Tracking
                  </CardTitle>
                  <CardDescription>
                    Monitor team objectives and key results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• OKR (Objectives and Key Results) framework</li>
                    <li>• Goal cascading from organization to team</li>
                    <li>• Progress tracking and updates</li>
                    <li>• Milestone management</li>
                    <li>• Achievement celebrations</li>
                    <li>• Performance reviews integration</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics & Insights
                  </CardTitle>
                  <CardDescription>
                    Data-driven team performance insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Team productivity metrics</li>
                    <li>• Collaboration effectiveness</li>
                    <li>• Workload distribution analysis</li>
                    <li>• Performance trend tracking</li>
                    <li>• Burnout risk indicators</li>
                    <li>• Custom reporting dashboards</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="automation" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Workflow Automation
                  </CardTitle>
                  <CardDescription>
                    Streamline repetitive team processes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automated task assignment rules</li>
                    <li>• Workflow triggers and actions</li>
                    <li>• Approval process automation</li>
                    <li>• Notification and reminder systems</li>
                    <li>• Integration with external tools</li>
                    <li>• Custom automation scripts</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Smart Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-powered team optimization suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Workload balancing suggestions</li>
                    <li>• Skill gap identification</li>
                    <li>• Team composition optimization</li>
                    <li>• Process improvement recommendations</li>
                    <li>• Resource allocation insights</li>
                    <li>• Performance enhancement tips</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Team Types */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Award className="h-8 w-8 text-primary" />
          Team Types & Templates
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Project Teams</CardTitle>
              <CardDescription>
                Cross-functional teams for specific projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Temporary</Badge>
                <Badge variant="secondary">Cross-functional</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Project-specific objectives</li>
                <li>• Defined timeline and milestones</li>
                <li>• Mixed skill sets and expertise</li>
                <li>• Agile workflow support</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Department Teams</CardTitle>
              <CardDescription>
                Permanent teams organized by function
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Permanent</Badge>
                <Badge variant="secondary">Functional</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Department-specific goals</li>
                <li>• Hierarchical structure</li>
                <li>• Specialized skill focus</li>
                <li>• Long-term objectives</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Innovation Teams</CardTitle>
              <CardDescription>
                Creative teams for research and development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Creative</Badge>
                <Badge variant="secondary">Experimental</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Innovation-focused objectives</li>
                <li>• Flexible structure</li>
                <li>• Experimentation support</li>
                <li>• Rapid prototyping tools</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Best Practices */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Best Practices</h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Badge variant="secondary">Structure</Badge>
            <h4 className="font-medium">Clear Team Structure</h4>
            <p className="text-sm text-muted-foreground">
              Define clear roles, responsibilities, and reporting structures for optimal team function.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Communication</Badge>
            <h4 className="font-medium">Open Communication</h4>
            <p className="text-sm text-muted-foreground">
              Foster transparent communication channels and regular check-ins for team alignment.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Goals</Badge>
            <h4 className="font-medium">Aligned Objectives</h4>
            <p className="text-sm text-muted-foreground">
              Ensure team goals align with organizational objectives and individual aspirations.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/getting-started">
              <Users className="mr-2 h-4 w-4" />
              Create Your First Team
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/hr-management">
              HR Management Guide
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/workspaces">
              Workspace Setup
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}