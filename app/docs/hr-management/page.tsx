'use client';

import { Users, UserPlus, Clock, DollarSign, BarChart3, Shield, Calendar, FileText, Award, Target, TrendingUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function HRManagementPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          HR Management
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Comprehensive employee lifecycle management with payroll, attendance tracking, recruitment, performance management, and HR analytics.
        </p>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Core HR Features
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Employee Management
              </CardTitle>
              <CardDescription>
                Complete employee lifecycle from onboarding to offboarding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Employee profiles and records</li>
                <li>• Onboarding workflows</li>
                <li>• Document management</li>
                <li>• Organizational charts</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Payroll Management
              </CardTitle>
              <CardDescription>
                Automated payroll processing with compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Automated salary calculations</li>
                <li>• Tax deductions and compliance</li>
                <li>• Payslip generation</li>
                <li>• Benefits administration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Time & Attendance
              </CardTitle>
              <CardDescription>
                Comprehensive time tracking and attendance management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Digital time tracking</li>
                <li>• Leave management</li>
                <li>• Overtime calculations</li>
                <li>• Attendance reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Recruitment
              </CardTitle>
              <CardDescription>
                End-to-end recruitment and hiring process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Job posting management</li>
                <li>• Applicant tracking system</li>
                <li>• Interview scheduling</li>
                <li>• Candidate evaluation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-red-500" />
                Performance Management
              </CardTitle>
              <CardDescription>
                Goal setting, reviews, and performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Goal setting and tracking</li>
                <li>• Performance reviews</li>
                <li>• 360-degree feedback</li>
                <li>• Career development plans</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                HR Analytics
              </CardTitle>
              <CardDescription>
                Data-driven insights for HR decision making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Employee analytics</li>
                <li>• Turnover analysis</li>
                <li>• Performance metrics</li>
                <li>• Compensation analysis</li>
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
          HR Management Guide
        </h2>
        
        <Tabs defaultValue="employee-management" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="employee-management">Employee Management</TabsTrigger>
            <TabsTrigger value="payroll">Payroll & Benefits</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employee-management" className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Employee Onboarding
                  </CardTitle>
                  <CardDescription>
                    Streamlined onboarding process for new hires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Digital onboarding workflows</li>
                    <li>• Document collection and verification</li>
                    <li>• Equipment and access provisioning</li>
                    <li>• Training schedule assignment</li>
                    <li>• Buddy system integration</li>
                    <li>• Progress tracking and checklists</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Employee Records
                  </CardTitle>
                  <CardDescription>
                    Comprehensive employee information management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Personal and contact information</li>
                    <li>• Employment history and contracts</li>
                    <li>• Skills and certifications</li>
                    <li>• Emergency contacts</li>
                    <li>• Document storage and versioning</li>
                    <li>• Compliance tracking</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payroll" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payroll Processing
                  </CardTitle>
                  <CardDescription>
                    Automated and accurate payroll calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automated salary calculations</li>
                    <li>• Overtime and bonus processing</li>
                    <li>• Tax calculations and deductions</li>
                    <li>• Direct deposit management</li>
                    <li>• Payslip generation and distribution</li>
                    <li>• Year-end tax reporting</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Benefits Administration
                  </CardTitle>
                  <CardDescription>
                    Comprehensive benefits management system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Health insurance management</li>
                    <li>• Retirement plan administration</li>
                    <li>• Flexible spending accounts</li>
                    <li>• Employee assistance programs</li>
                    <li>• Benefits enrollment periods</li>
                    <li>• Cost tracking and reporting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recruitment" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Applicant Tracking
                  </CardTitle>
                  <CardDescription>
                    Complete recruitment pipeline management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Job posting creation and distribution</li>
                    <li>• Resume parsing and screening</li>
                    <li>• Candidate pipeline management</li>
                    <li>• Interview scheduling and coordination</li>
                    <li>• Collaborative candidate evaluation</li>
                    <li>• Offer management and tracking</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Hiring Process
                  </CardTitle>
                  <CardDescription>
                    Streamlined hiring workflows and approvals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Multi-stage interview processes</li>
                    <li>• Reference and background checks</li>
                    <li>• Approval workflows</li>
                    <li>• Offer letter generation</li>
                    <li>• Contract management</li>
                    <li>• Onboarding integration</li>
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
                    <Award className="h-5 w-5" />
                    Performance Reviews
                  </CardTitle>
                  <CardDescription>
                    Comprehensive performance evaluation system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Customizable review templates</li>
                    <li>• 360-degree feedback collection</li>
                    <li>• Goal setting and tracking</li>
                    <li>• Performance rating scales</li>
                    <li>• Development plan creation</li>
                    <li>• Review cycle automation</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Career Development
                  </CardTitle>
                  <CardDescription>
                    Employee growth and development tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Skills assessment and gap analysis</li>
                    <li>• Learning and development plans</li>
                    <li>• Career path mapping</li>
                    <li>• Mentorship program management</li>
                    <li>• Training completion tracking</li>
                    <li>• Succession planning</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Compliance & Security */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Compliance & Security
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
              <CardDescription>
                Ensuring employee data privacy and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">GDPR Compliant</Badge>
                <Badge variant="secondary">SOC 2 Type II</Badge>
                <Badge variant="secondary">ISO 27001</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• End-to-end data encryption</li>
                <li>• Role-based access controls</li>
                <li>• Audit trails and logging</li>
                <li>• Data retention policies</li>
                <li>• Right to be forgotten</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
              <CardDescription>
                Meeting employment law and regulatory requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">FLSA</Badge>
                <Badge variant="secondary">FMLA</Badge>
                <Badge variant="secondary">EEO</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Employment law compliance</li>
                <li>• Automated compliance reporting</li>
                <li>• Policy management</li>
                <li>• Training compliance tracking</li>
                <li>• Incident reporting</li>
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
            <Badge variant="secondary">Setup</Badge>
            <h4 className="font-medium">Initial Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Configure organizational structure, roles, and basic HR policies before onboarding employees.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Automation</Badge>
            <h4 className="font-medium">Workflow Automation</h4>
            <p className="text-sm text-muted-foreground">
              Automate repetitive HR tasks like onboarding, performance reviews, and compliance reporting.
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Analytics</Badge>
            <h4 className="font-medium">Data-Driven Decisions</h4>
            <p className="text-sm text-muted-foreground">
              Use HR analytics to identify trends, improve retention, and optimize workforce planning.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/docs/getting-started">
              <Users className="mr-2 h-4 w-4" />
              Setup HR Module
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