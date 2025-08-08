'use client';

import { Shield, Users, Key, Lock, Settings, UserCheck, Crown, Eye, FileText, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RolesPermissionsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Roles & Permissions
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Configure granular user roles, permissions, and access controls with enterprise-grade security and compliance features.
        </p>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Best Practice</AlertTitle>
        <AlertDescription>
          Follow the principle of least privilege: grant users only the minimum permissions necessary to perform their job functions effectively.
        </AlertDescription>
      </Alert>

      {/* Core Permission Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8 text-primary" />
          Access Control Features
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Role-Based Access
              </CardTitle>
              <CardDescription>
                Hierarchical role system with inherited permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Predefined organizational roles</li>
                <li>• Custom role creation</li>
                <li>• Permission inheritance</li>
                <li>• Role templates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-500" />
                Granular Permissions
              </CardTitle>
              <CardDescription>
                Fine-grained control over system resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Resource-level permissions</li>
                <li>• Action-specific controls</li>
                <li>• Conditional access rules</li>
                <li>• Time-based restrictions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                Access Monitoring
              </CardTitle>
              <CardDescription>
                Real-time access tracking and audit trails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Access attempt logging</li>
                <li>• Permission usage analytics</li>
                <li>• Anomaly detection</li>
                <li>• Compliance reporting</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                Dynamic Permissions
              </CardTitle>
              <CardDescription>
                Context-aware and adaptive access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Location-based access</li>
                <li>• Device-specific permissions</li>
                <li>• Project-based roles</li>
                <li>• Temporary access grants</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-red-500" />
                User Management
              </CardTitle>
              <CardDescription>
                Comprehensive user lifecycle management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• User provisioning/deprovisioning</li>
                <li>• Bulk role assignments</li>
                <li>• Access reviews</li>
                <li>• Identity federation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-500" />
                Automation
              </CardTitle>
              <CardDescription>
                Automated role and permission management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Auto-role assignment rules</li>
                <li>• Permission workflows</li>
                <li>• Access request automation</li>
                <li>• Compliance automation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Default Roles */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-primary" />
          Default System Roles
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Super Administrator
              </CardTitle>
              <CardDescription>
                Full system access with all administrative privileges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="destructive">Highest Privilege</Badge>
                <Badge variant="secondary">System Management</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Complete system configuration</li>
                <li>• User and role management</li>
                <li>• Security policy configuration</li>
                <li>• System monitoring and maintenance</li>
                <li>• Audit log access</li>
                <li>• Emergency access procedures</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Organization Administrator
              </CardTitle>
              <CardDescription>
                Manage organization settings and user access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">High Privilege</Badge>
                <Badge variant="secondary">Organization Scope</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Organization configuration</li>
                <li>• User invitation and management</li>
                <li>• Team creation and management</li>
                <li>• Workspace administration</li>
                <li>• Billing and subscription management</li>
                <li>• Integration configuration</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Team Manager
              </CardTitle>
              <CardDescription>
                Lead and manage specific teams and projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Medium Privilege</Badge>
                <Badge variant="secondary">Team Scope</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Team member management</li>
                <li>• Project creation and oversight</li>
                <li>• Task assignment and tracking</li>
                <li>• Team performance monitoring</li>
                <li>• Resource allocation</li>
                <li>• Team reporting and analytics</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-500" />
                Team Member
              </CardTitle>
              <CardDescription>
                Standard user with project collaboration access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">Standard Privilege</Badge>
                <Badge variant="secondary">Project Scope</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Project participation</li>
                <li>• Task management</li>
                <li>• Document collaboration</li>
                <li>• Team communication</li>
                <li>• Time tracking</li>
                <li>• Personal dashboard access</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Permission Management Guide */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Permission Management Guide
        </h2>
        
        <Tabs defaultValue="role-setup" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="role-setup">Role Setup</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="access-control">Access Control</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="role-setup" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Creating Custom Roles
                  </CardTitle>
                  <CardDescription>
                    Design roles that match your organization structure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Define role purpose and scope</li>
                    <li>• Select base permissions template</li>
                    <li>• Configure specific permissions</li>
                    <li>• Set role hierarchy and inheritance</li>
                    <li>• Test role functionality</li>
                    <li>• Document role responsibilities</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Role Assignment
                  </CardTitle>
                  <CardDescription>
                    Efficiently assign roles to users and groups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Individual user role assignment</li>
                    <li>• Bulk role assignment tools</li>
                    <li>• Group-based role inheritance</li>
                    <li>• Temporary role assignments</li>
                    <li>• Role assignment workflows</li>
                    <li>• Assignment approval processes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="permissions" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Permission Categories
                  </CardTitle>
                  <CardDescription>
                    Understanding different types of permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>System:</strong> Core platform administration</li>
                    <li>• <strong>Organization:</strong> Company-wide settings</li>
                    <li>• <strong>Workspace:</strong> Workspace management</li>
                    <li>• <strong>Project:</strong> Project-specific access</li>
                    <li>• <strong>Resource:</strong> File and data permissions</li>
                    <li>• <strong>Feature:</strong> Module-specific access</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Permission Levels
                  </CardTitle>
                  <CardDescription>
                    Granular control over user capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Read:</strong> View-only access to resources</li>
                    <li>• <strong>Write:</strong> Create and edit capabilities</li>
                    <li>• <strong>Delete:</strong> Remove resources and data</li>
                    <li>• <strong>Admin:</strong> Full management access</li>
                    <li>• <strong>Share:</strong> Grant access to others</li>
                    <li>• <strong>Execute:</strong> Run processes and workflows</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="access-control" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Conditional Access
                  </CardTitle>
                  <CardDescription>
                    Context-aware security policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• IP address restrictions</li>
                    <li>• Device compliance requirements</li>
                    <li>• Time-based access windows</li>
                    <li>• Geographic location controls</li>
                    <li>• Multi-factor authentication triggers</li>
                    <li>• Risk-based access decisions</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Access
                  </CardTitle>
                  <CardDescription>
                    Break-glass procedures for critical situations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Emergency access protocols</li>
                    <li>• Temporary privilege escalation</li>
                    <li>• Audit trail for emergency access</li>
                    <li>• Automatic access revocation</li>
                    <li>• Incident response integration</li>
                    <li>• Compliance reporting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Access Monitoring
                  </CardTitle>
                  <CardDescription>
                    Track and analyze user access patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time access monitoring</li>
                    <li>• Failed access attempt tracking</li>
                    <li>• Unusual activity detection</li>
                    <li>• Permission usage analytics</li>
                    <li>• Access pattern analysis</li>
                    <li>• Security incident alerts</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Compliance Reporting
                  </CardTitle>
                  <CardDescription>
                    Generate reports for audits and compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• User access reports</li>
                    <li>• Permission change logs</li>
                    <li>• Role assignment history</li>
                    <li>• Compliance dashboard</li>
                    <li>• Automated report generation</li>
                    <li>• Export capabilities (PDF, CSV)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Best Practices */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Security Best Practices</h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Badge variant="secondary">Principle</Badge>
            <h4 className="font-medium">Least Privilege</h4>
            <p className="text-sm text-muted-foreground">
              Grant users only the minimum permissions necessary to perform their job functions.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Review</Badge>
            <h4 className="font-medium">Regular Access Reviews</h4>
            <p className="text-sm text-muted-foreground">
              Conduct quarterly reviews of user permissions and role assignments.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Separation</Badge>
            <h4 className="font-medium">Duty Separation</h4>
            <p className="text-sm text-muted-foreground">
              Separate critical functions across multiple roles to prevent conflicts of interest.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Documentation</Badge>
            <h4 className="font-medium">Role Documentation</h4>
            <p className="text-sm text-muted-foreground">
              Maintain clear documentation of role responsibilities and permissions.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Automation</Badge>
            <h4 className="font-medium">Automated Provisioning</h4>
            <p className="text-sm text-muted-foreground">
              Use automated workflows for consistent role assignment and deprovisioning.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Monitoring</Badge>
            <h4 className="font-medium">Continuous Monitoring</h4>
            <p className="text-sm text-muted-foreground">
              Monitor access patterns and detect anomalies in real-time.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/security">
              <Shield className="mr-2 h-4 w-4" />
              Security Overview
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/team-management">
              Team Management
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/getting-started">
              Getting Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}