'use client';

import { CheckCircle, Users, Settings, Rocket, ArrowRight, Play, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Getting Started
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Welcome to SPT Teams! This guide will help you set up your workspace and get your team onboarded quickly.
        </p>
      </div>

      {/* Quick Start Steps */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="h-8 w-8 text-primary" />
          Quick Start Guide
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">Step 1</Badge>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg">Setup Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Create your organization workspace and configure basic settings.
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href="#workspace-setup">
                  Start Setup
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">Step 2</Badge>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg">Invite Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Add team members and assign appropriate roles and permissions.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="#team-setup">
                  Add Members
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">Step 3</Badge>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg">Configure Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Set up security policies and access controls for your workspace.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="#security-setup">
                  Setup Security
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">Step 4</Badge>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardTitle className="text-lg">Start Using</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Begin using SPT Teams features and explore advanced capabilities.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="#explore-features">
                  Explore Features
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Setup Sections */}
      <div id="workspace-setup" className="space-y-6">
        <h2 className="text-3xl font-bold">🏢 Workspace Setup</h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Create Organization
              </CardTitle>
              <CardDescription>
                Set up your organization&apos;s main workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Steps:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Enter your organization name</li>
                  <li>• Choose a workspace URL</li>
                  <li>• Select your industry type</li>
                  <li>• Configure basic settings</li>
                </ul>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/workspaces">
                  Learn More About Workspaces
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Initial Configuration
              </CardTitle>
              <CardDescription>
                Configure essential workspace settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Key Settings:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Time zone and locale</li>
                  <li>• Business hours</li>
                  <li>• Currency and region</li>
                  <li>• Notification preferences</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <div id="team-setup" className="space-y-6">
        <h2 className="text-3xl font-bold">👥 Team Setup</h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>
                Add team members to your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Send email invitations or share workspace links with your team members.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/team-management">
                  Team Management Guide
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assign Roles</CardTitle>
              <CardDescription>
                Set up role-based access control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Define roles and permissions to control access to different features and data.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/roles-and-permissions">
                  Roles & Permissions
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Structure</CardTitle>
              <CardDescription>
                Organize teams by departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create departments and assign team members to organize your workspace effectively.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <div id="security-setup" className="space-y-6">
        <h2 className="text-3xl font-bold">🔒 Security Configuration</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Essential Security Settings</CardTitle>
            <CardDescription>
              Protect your workspace with these security measures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Authentication</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Two-factor authentication (2FA)</li>
                  <li>• Single sign-on (SSO)</li>
                  <li>• Password policies</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Access Control</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• IP restrictions</li>
                  <li>• Session management</li>
                  <li>• Audit logging</li>
                </ul>
              </div>
            </div>
            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/docs/security">
                  Complete Security Guide
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div id="explore-features" className="space-y-6">
        <h2 className="text-3xl font-bold">🚀 Explore Features</h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Organize, share, and collaborate on documents with version control.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/document-management">Explore</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Track expenses, manage budgets, and handle invoicing.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/financial-management">Explore</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HR Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Manage employees, payroll, attendance, and recruitment.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/hr-management">Explore</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar & Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Schedule events, manage tasks, and coordinate team activities.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/calendar-tasks">Explore</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Get AI-powered insights and workflow recommendations.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/ai-assistant">Explore</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Generate insights with comprehensive analytics and reports.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/reporting-analytics">Explore</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-2xl font-bold">🎯 Next Steps</h2>
        <p className="text-muted-foreground">
          Now that you&apos;ve completed the basic setup, here are some recommended next steps:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium">Immediate Actions</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Complete your profile setup</li>
              <li>• Import existing data</li>
              <li>• Set up integrations</li>
              <li>• Configure notifications</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Long-term Planning</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Plan department structures</li>
              <li>• Design workflow processes</li>
              <li>• Set up reporting schedules</li>
              <li>• Train team members</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/team-management">
              Continue with Team Setup
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/troubleshooting">
              Need Help?
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}