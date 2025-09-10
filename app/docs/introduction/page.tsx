'use client';

import { 
  BookOpen, 
  Rocket, 
  Building2, 
  Shield, 
  Users, 
  BarChart3, 
  FolderOpen, 
  Wallet, 
  UserPlus, 
  Calendar, 
  Bot, 
  Lock 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntroductionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome to SPT Teams
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          SPT Teams is a comprehensive enterprise management platform designed to streamline organizational operations, 
          enhance team collaboration, and provide powerful insights through AI-driven analytics.
        </p>
      </div>

      {/* Quick Start */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Link href="/docs/getting-started">
            <Rocket className="mr-2 h-4 w-4" />
            Get Started
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/docs/workspaces">
            <Building2 className="mr-2 h-4 w-4" />
            Learn About Workspaces
          </Link>
        </Button>
      </div>

      {/* Platform Overview */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🎯 What is SPT Teams?</h2>
        <p className="text-lg text-muted-foreground">
          SPT Teams is an all-in-one enterprise platform that provides:
        </p>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Hierarchical Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize your business with main workspaces and sub-workspaces for complete organizational control.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Advanced RBAC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Granular permissions for owners, admins, and members with comprehensive access control.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered team formation and collaboration insights for optimal productivity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Dynamic Reporting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive reporting with real-time insights and cross-workspace analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Financial Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete expense, budget, and invoice management with multi-currency support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                HR Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Employee management, payroll, attendance, and recruitment with advanced analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Who is it for */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🏢 Who is SPT Teams For?</h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="text-primary">Enterprise Organizations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-location businesses with regional offices</li>
                <li>• Organizations with complex hierarchical structures</li>
                <li>• Companies requiring granular access control</li>
                <li>• Businesses needing comprehensive audit trails</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardHeader>
              <CardTitle className="text-accent">Team Leaders & Managers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Project managers coordinating cross-functional teams</li>
                <li>• HR professionals managing employee lifecycle</li>
                <li>• Financial controllers overseeing budgets</li>
                <li>• Department heads requiring detailed analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-muted bg-gradient-to-br from-muted/20 to-background">
            <CardHeader>
              <CardTitle>Individual Contributors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Team members collaborating on projects</li>
                <li>• Employees submitting reports and expenses</li>
                <li>• Staff managing personal schedules and tasks</li>
                <li>• Users seeking AI-powered productivity insights</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🚀 Key Benefits</h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-primary">For Organizations</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Scalable Architecture</strong> - Grow from startup to enterprise seamlessly</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Cost Efficiency</strong> - Reduce operational overhead with integrated tools</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Compliance Ready</strong> - Built-in audit trails and permission controls</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Data-Driven Insights</strong> - AI-powered analytics for informed decisions</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-accent">For Teams & Individuals</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span><strong>Enhanced Collaboration</strong> - Real-time communication and file sharing</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span><strong>Streamlined Workflows</strong> - Automated processes and smart recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span><strong>Transparent Operations</strong> - Clear visibility into project status and progress</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span><strong>Personalized Experience</strong> - Role-based interfaces and AI insights</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Brand Design Philosophy */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-3xl font-bold">🎨 Brand Design Philosophy</h2>
        <p className="text-muted-foreground">
          SPT Teams features a modern, professional design system built around:
        </p>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#8A0F3C' }} />
              <span className="font-medium">Deep Maroon Primary (#8A0F3C)</span>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              Represents trust, stability, and professionalism
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#CF163C' }} />
              <span className="font-medium">Bright Crimson Accent (#CF163C)</span>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              Signifies energy, innovation, and action
            </p>
          </div>
        </div>
        
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="font-medium">Clean Typography</div>
            <div className="text-muted-foreground">Ensures readability</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="font-medium">Consistent Spacing</div>
            <div className="text-muted-foreground">space-y-6 design system</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="font-medium">Responsive Design</div>
            <div className="text-muted-foreground">Mobile-first approach</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="font-medium">Accessibility</div>
            <div className="text-muted-foreground">WCAG compliant</div>
          </div>
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Lock className="h-8 w-8 text-primary" />
          Security & Compliance
        </h2>
        <p className="text-muted-foreground">
          SPT Teams is built with enterprise-grade security:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium">Bank-Level Encryption</div>
              <div className="text-sm text-muted-foreground">All data encrypted in transit and at rest</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium">Role-Based Access Control</div>
              <div className="text-sm text-muted-foreground">Granular permissions for data protection</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium">Audit Trails</div>
              <div className="text-sm text-muted-foreground">Complete activity logging for compliance</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium">Multi-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Enhanced account security</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FolderOpen className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium">Data Privacy</div>
              <div className="text-sm text-muted-foreground">GDPR and SOC 2 compliant</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <div className="font-medium">Regular Security Audits</div>
              <div className="text-sm text-muted-foreground">Continuous security monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20">
        <h2 className="text-3xl font-bold">🌟 Getting Started</h2>
        <p className="text-muted-foreground">
          Ready to transform your organization? Here&apos;s how to get started:
        </p>
        
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <div className="font-medium">Explore the Documentation</div>
              <div className="text-sm text-muted-foreground">Learn about each feature in detail</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <div className="font-medium">Set Up Your Workspace</div>
              <div className="text-sm text-muted-foreground">Create your first workspace and invite team members</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <div className="font-medium">Configure Permissions</div>
              <div className="text-sm text-muted-foreground">Set up role-based access control</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">4</span>
            <div>
              <div className="font-medium">Import Your Data</div>
              <div className="text-sm text-muted-foreground">Migrate existing data and workflows</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">5</span>
            <div>
              <div className="font-medium">Train Your Team</div>
              <div className="text-sm text-muted-foreground">Use our comprehensive guides to onboard users</div>
            </div>
          </li>
        </ol>

        <div className="pt-4">
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
            <Link href="/docs/getting-started">
              <Rocket className="mr-2 h-4 w-4" />
              Begin with Getting Started
            </Link>
          </Button>
        </div>
      </div>

      {/* Support & Resources */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📞 Support & Resources</h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-medium">Documentation</div>
              <div className="text-sm text-muted-foreground">Comprehensive guides</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Calendar className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-medium">Video Tutorials</div>
              <div className="text-sm text-muted-foreground">Step-by-step walkthroughs</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Users className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-medium">Community Forum</div>
              <div className="text-sm text-muted-foreground">Connect with other users</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Bot className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-medium">24/7 Support</div>
              <div className="text-sm text-muted-foreground">Expert assistance</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="font-medium">Training Programs</div>
              <div className="text-sm text-muted-foreground">Customized training</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}