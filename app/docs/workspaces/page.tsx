'use client';

import { Building2, Settings, Users, Shield, Globe, Database, Zap, BarChart3, FileText, Calendar, Wallet, UserCheck, Lock, Workflow, Bell, Palette, Monitor } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WorkspacesPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Workspace Management
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Create, configure, and manage powerful workspaces that adapt to your organization&apos;s unique needs and workflows.
        </p>
      </div>

      {/* Workspace Overview */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Workspace Features
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Workspace Configuration
              </CardTitle>
              <CardDescription>
                Customize your workspace settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Custom branding and themes</li>
                <li>• Module activation/deactivation</li>
                <li>• Workflow customization</li>
                <li>• Integration settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Team Management
              </CardTitle>
              <CardDescription>
                Organize and manage your team structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Department organization</li>
                <li>• Role assignments</li>
                <li>• Permission management</li>
                <li>• Team hierarchies</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Security & Compliance
              </CardTitle>
              <CardDescription>
                Enterprise-grade security and compliance features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Multi-factor authentication</li>
                <li>• Data encryption</li>
                <li>• Audit logging</li>
                <li>• Compliance reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                Data Management
              </CardTitle>
              <CardDescription>
                Centralized data storage and organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Centralized data storage</li>
                <li>• Backup and recovery</li>
                <li>• Data migration tools</li>
                <li>• Version control</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Automation & Workflows
              </CardTitle>
              <CardDescription>
                Streamline processes with intelligent automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Custom workflow builders</li>
                <li>• Automated notifications</li>
                <li>• Process triggers</li>
                <li>• Integration automation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Analytics & Reporting
              </CardTitle>
              <CardDescription>
                Comprehensive insights and reporting capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Real-time dashboards</li>
                <li>• Custom reports</li>
                <li>• Performance metrics</li>
                <li>• Data visualization</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Workspace Setup Guide */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🚀 Workspace Setup Guide</h2>
        
        <Tabs defaultValue="initial-setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="initial-setup">Initial Setup</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="team-setup">Team Setup</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="initial-setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started with Your Workspace</CardTitle>
                <CardDescription>
                  Follow these steps to set up your new workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="secondary">1</Badge>
                      Create Workspace
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                      <li>• Choose workspace name and URL</li>
                      <li>• Select your organization type</li>
                      <li>• Configure basic settings</li>
                      <li>• Set timezone and locale</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="secondary">2</Badge>
                      Choose Modules
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                      <li>• Select required modules</li>
                      <li>• Configure module settings</li>
                      <li>• Set up integrations</li>
                      <li>• Test functionality</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="secondary">3</Badge>
                      Security Setup
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                      <li>• Enable two-factor authentication</li>
                      <li>• Configure password policies</li>
                      <li>• Set up access controls</li>
                      <li>• Review security settings</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Badge variant="secondary">4</Badge>
                      Initial Data
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                      <li>• Import existing data</li>
                      <li>• Set up data structures</li>
                      <li>• Configure workflows</li>
                      <li>• Test data integrity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="configuration" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Branding & Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Upload company logo and favicon</li>
                    <li>• Customize color schemes and themes</li>
                    <li>• Set up custom domain</li>
                    <li>• Configure email templates</li>
                    <li>• Customize navigation menus</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Configure notification preferences</li>
                    <li>• Set up email notifications</li>
                    <li>• Configure push notifications</li>
                    <li>• Set alert thresholds</li>
                    <li>• Customize notification templates</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    Workflow Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Design custom workflows</li>
                    <li>• Set up approval processes</li>
                    <li>• Configure automation rules</li>
                    <li>• Define escalation procedures</li>
                    <li>• Test workflow functionality</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Integration Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Connect third-party applications</li>
                    <li>• Configure API endpoints</li>
                    <li>• Set up data synchronization</li>
                    <li>• Manage integration permissions</li>
                    <li>• Monitor integration health</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="team-setup" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Structure & Organization</CardTitle>
                  <CardDescription>
                    Set up your team hierarchy and organizational structure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Departments</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Create department structure</li>
                        <li>• Assign department heads</li>
                        <li>• Set department permissions</li>
                        <li>• Configure department workflows</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Roles & Permissions</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Define custom roles</li>
                        <li>• Set role permissions</li>
                        <li>• Create permission groups</li>
                        <li>• Manage access levels</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">Team Members</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Invite team members</li>
                        <li>• Assign roles and departments</li>
                        <li>• Set up user profiles</li>
                        <li>• Configure user permissions</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Advanced Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Single Sign-On (SSO) integration</li>
                    <li>• Advanced audit logging</li>
                    <li>• IP whitelisting and restrictions</li>
                    <li>• Data encryption at rest</li>
                    <li>• Compliance reporting</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Performance Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time performance metrics</li>
                    <li>• System health monitoring</li>
                    <li>• Usage analytics and insights</li>
                    <li>• Performance optimization</li>
                    <li>• Capacity planning</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Module Integration */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 Module Integration</h2>
        <p className="text-muted-foreground">
          SPT Teams workspaces seamlessly integrate all modules for a unified experience.
        </p>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2">
                <Users className="h-8 w-8 text-blue-500" />
                HR Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Complete employee lifecycle management
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/hr-management">
                  Learn More
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2">
                <Wallet className="h-8 w-8 text-green-500" />
                Financial Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive financial tracking and reporting
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/financial-management">
                  Learn More
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2">
                <Calendar className="h-8 w-8 text-purple-500" />
                Calendar & Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Intelligent scheduling and task management
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/calendar-tasks">
                  Learn More
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 text-orange-500" />
                Document Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Centralized document storage and collaboration
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/document-management">
                  Learn More
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Best Practices */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">💡 Best Practices</h2>
        
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            A well-configured workspace is the foundation of organizational efficiency. Take time to properly set up your workspace for long-term success.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use clear, descriptive naming conventions</li>
                <li>• Organize teams by function and hierarchy</li>
                <li>• Implement consistent data structures</li>
                <li>• Regular cleanup and maintenance</li>
                <li>• Document your workspace configuration</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Implement principle of least privilege</li>
                <li>• Regular security audits and reviews</li>
                <li>• Keep software and integrations updated</li>
                <li>• Train team members on security practices</li>
                <li>• Maintain compliance documentation</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Monitor workspace performance metrics</li>
                <li>• Optimize workflows and processes</li>
                <li>• Regular data cleanup and archiving</li>
                <li>• Use automation to reduce manual tasks</li>
                <li>• Gather user feedback for improvements</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Plan changes carefully and communicate early</li>
                <li>• Test changes in staging environment</li>
                <li>• Provide training for new features</li>
                <li>• Maintain backup and rollback procedures</li>
                <li>• Document all configuration changes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-2xl font-bold">🎯 Ready to Set Up Your Workspace?</h2>
        <p className="text-muted-foreground">
          Follow our comprehensive setup guide to create a workspace that perfectly fits your organization&apos;s needs.
        </p>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <Badge variant="secondary">Quick Start</Badge>
            <h4 className="font-medium">Basic Setup</h4>
            <p className="text-sm text-muted-foreground">
              Get your workspace up and running in minutes with our quick setup wizard.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Customization</Badge>
            <h4 className="font-medium">Advanced Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Customize every aspect of your workspace to match your organization&apos;s needs.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Migration</Badge>
            <h4 className="font-medium">Data Import</h4>
            <p className="text-sm text-muted-foreground">
              Seamlessly migrate your existing data and workflows to SPT Teams.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/getting-started">
              <Building2 className="mr-2 h-4 w-4" />
              Start Setup
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/team-management">
              Team Management Guide
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/security">
              Security Best Practices
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}