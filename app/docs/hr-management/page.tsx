'use client';

import { Users, UserPlus, Clock, DollarSign, BarChart3, Shield, Calendar, FileText, Award, Target, TrendingUp, CheckCircle, Video, MapPin, Workflow, CreditCard, Timer, ClipboardList, Star, MessageSquare } from 'lucide-react';
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
                <li>• Enhanced payslip generation</li>
                <li>• Payment system integration</li>
                <li>• Benefits administration</li>
                <li>• Payroll analytics & reports</li>
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
                <li>• Digital clock-in/out system</li>
                <li>• Location tracking & verification</li>
                <li>• Break time management</li>
                <li>• Shift scheduling</li>
                <li>• Multi-level leave approval</li>
                <li>• Attendance analytics</li>
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
                <li>• Interview scheduling with calendar integration</li>
                <li>• Video interview support</li>
                <li>• Candidate evaluation & scoring</li>
                <li>• Recruitment analytics</li>
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

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-cyan-500" />
                Employee Onboarding
              </CardTitle>
              <CardDescription>
                Automated onboarding workflows and tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Automated onboarding checklists</li>
                <li>• Document collection & verification</li>
                <li>• Role assignment automation</li>
                <li>• Welcome workflows</li>
                <li>• Progress tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-pink-500" />
                Interview Management
              </CardTitle>
              <CardDescription>
                Advanced interview scheduling and evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Calendar integration</li>
                <li>• Video interview support</li>
                <li>• Structured feedback forms</li>
                <li>• Candidate scoring systems</li>
                <li>• Interview analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-emerald-500" />
                Leave Management
              </CardTitle>
              <CardDescription>
                Comprehensive leave tracking and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Digital leave applications</li>
                <li>• Multi-level approval workflows</li>
                <li>• Leave balance tracking</li>
                <li>• Calendar integration</li>
                <li>• Leave analytics</li>
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="employee-management">Employee</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
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
                    Salary Management
                  </CardTitle>
                  <CardDescription>
                    Configure salaries, allowances, and deductions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Flexible salary structure configuration</li>
                    <li>• Multiple allowance types and categories</li>
                    <li>• Automated deduction calculations</li>
                    <li>• Performance-based variable pay</li>
                    <li>• Salary revision tracking and history</li>
                    <li>• Cost center allocation</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Payroll Processing
                  </CardTitle>
                  <CardDescription>
                    Automated payroll calculation and generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automated monthly payroll processing</li>
                    <li>• Overtime and bonus calculations</li>
                    <li>• Tax calculations and compliance</li>
                    <li>• Leave and attendance integration</li>
                    <li>• Multi-currency support</li>
                    <li>• Payroll approval workflows</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Payslip Generation
                  </CardTitle>
                  <CardDescription>
                    Digital payslips with detailed breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Detailed payslip with comprehensive breakdown</li>
                    <li>• Customizable payslip templates</li>
                    <li>• Digital distribution via email/portal</li>
                    <li>• Year-to-date summaries</li>
                    <li>• Tax deduction details</li>
                    <li>• Secure payslip access and download</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Integration
                  </CardTitle>
                  <CardDescription>
                    Integration with payment systems and banks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Direct bank transfer integration</li>
                    <li>• Multiple payment method support</li>
                    <li>• Automated payment scheduling</li>
                    <li>• Payment confirmation and tracking</li>
                    <li>• Failed payment handling and retry</li>
                    <li>• Payment audit trails</li>
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
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Payroll Reports
                  </CardTitle>
                  <CardDescription>
                    Comprehensive payroll analytics and compliance reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Monthly and annual payroll reports</li>
                    <li>• Tax compliance and statutory reports</li>
                    <li>• Cost center wise payroll analysis</li>
                    <li>• Employee cost analysis</li>
                    <li>• Payroll variance reports</li>
                    <li>• Export capabilities (PDF, Excel, CSV)</li>
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
                    <li>• Job posting creation and distribution across multiple platforms</li>
                    <li>• Public job board with dedicated careers page</li>
                    <li>• Resume parsing and automated screening</li>
                    <li>• Drag-and-drop candidate pipeline management</li>
                    <li>• Customizable recruitment stages</li>
                    <li>• Collaborative candidate evaluation</li>
                    <li>• Offer management and tracking</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Recruitment Analytics
                  </CardTitle>
                  <CardDescription>
                    Data-driven recruitment insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Application rate tracking and analysis</li>
                    <li>• Time-to-hire metrics and optimization</li>
                    <li>• Conversion rate analysis by stage</li>
                    <li>• Source effectiveness tracking</li>
                    <li>• Recruiter performance metrics</li>
                    <li>• Cost-per-hire calculations</li>
                    <li>• Diversity and inclusion analytics</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="interviews" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Interview Scheduling
                  </CardTitle>
                  <CardDescription>
                    Advanced scheduling with calendar integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Calendar integration with automated notifications</li>
                    <li>• Multi-interviewer coordination</li>
                    <li>• Time zone management for remote interviews</li>
                    <li>• Automated reminder emails</li>
                    <li>• Rescheduling and conflict resolution</li>
                    <li>• Interview room booking integration</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Interview Support
                  </CardTitle>
                  <CardDescription>
                    Seamless remote interview experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Integration with meeting platforms (Zoom, Teams, Meet)</li>
                    <li>• Automatic meeting link generation</li>
                    <li>• Recording capabilities for review</li>
                    <li>• Screen sharing and whiteboard tools</li>
                    <li>• Technical check and backup options</li>
                    <li>• Mobile-friendly interview access</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Feedback Management
                  </CardTitle>
                  <CardDescription>
                    Structured evaluation and feedback collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Structured interview feedback forms</li>
                    <li>• Customizable rating systems</li>
                    <li>• Competency-based evaluation criteria</li>
                    <li>• Real-time feedback collection</li>
                    <li>• Anonymous feedback options</li>
                    <li>• Feedback aggregation and analysis</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Candidate Scoring
                  </CardTitle>
                  <CardDescription>
                    Standardized evaluation and scoring mechanisms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Standardized scoring criteria</li>
                    <li>• Weighted evaluation categories</li>
                    <li>• Automated score calculations</li>
                    <li>• Comparative candidate ranking</li>
                    <li>• Score-based filtering and sorting</li>
                    <li>• Interview performance analytics</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="onboarding" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Onboarding Checklists
                  </CardTitle>
                  <CardDescription>
                    Automated task management for new hires
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automated onboarding task creation</li>
                    <li>• Role-specific checklist templates</li>
                    <li>• Task assignment and tracking</li>
                    <li>• Deadline management and reminders</li>
                    <li>• Progress visualization and reporting</li>
                    <li>• Integration with HR systems</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Collection
                  </CardTitle>
                  <CardDescription>
                    Digital document submission and verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Digital document upload portal</li>
                    <li>• Document verification workflows</li>
                    <li>• Secure document storage</li>
                    <li>• Compliance tracking and alerts</li>
                    <li>• E-signature integration</li>
                    <li>• Document expiry monitoring</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Role Assignment
                  </CardTitle>
                  <CardDescription>
                    Automatic role and permission setup
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automatic role assignment based on position</li>
                    <li>• Permission provisioning workflows</li>
                    <li>• System access setup automation</li>
                    <li>• Equipment and resource allocation</li>
                    <li>• Team integration and introductions</li>
                    <li>• Buddy system assignment</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Tracking
                  </CardTitle>
                  <CardDescription>
                    Monitor onboarding completion and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Real-time progress monitoring</li>
                    <li>• Engagement metrics and analytics</li>
                    <li>• Completion rate tracking</li>
                    <li>• Feedback collection and analysis</li>
                    <li>• Time-to-productivity metrics</li>
                    <li>• Onboarding effectiveness reporting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="attendance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Digital Clock-In/Out
                  </CardTitle>
                  <CardDescription>
                    Web-based attendance tracking system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Web-based clock-in/out interface</li>
                    <li>• Mobile app support for remote workers</li>
                    <li>• Biometric integration options</li>
                    <li>• Offline mode with sync capabilities</li>
                    <li>• Real-time attendance monitoring</li>
                    <li>• Automated timesheet generation</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Tracking
                  </CardTitle>
                  <CardDescription>
                    Optional location verification for attendance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• GPS-based location verification</li>
                    <li>• Geofencing for office premises</li>
                    <li>• Remote work location tracking</li>
                    <li>• Privacy-compliant location services</li>
                    <li>• Location-based attendance policies</li>
                    <li>• Travel time calculation</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Break Management
                  </CardTitle>
                  <CardDescription>
                    Track break times and total work hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Automated break time tracking</li>
                    <li>• Customizable break policies</li>
                    <li>• Overtime calculation and alerts</li>
                    <li>• Work-life balance monitoring</li>
                    <li>• Break compliance reporting</li>
                    <li>• Productivity analytics</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Shift Scheduling
                  </CardTitle>
                  <CardDescription>
                    Flexible shift pattern configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Flexible shift pattern creation</li>
                    <li>• Automated shift assignment</li>
                    <li>• Shift swap and coverage management</li>
                    <li>• Availability tracking</li>
                    <li>• Shift conflict resolution</li>
                    <li>• Schedule optimization algorithms</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          

        </Tabs>
      </div>

      <Separator />

      {/* Advanced HR Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Advanced HR Features
        </h2>
        <p className="text-lg text-muted-foreground">
          Comprehensive analytics and automation capabilities for modern HR management
        </p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                HR Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Real-time insights and data visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Employee turnover analysis</li>
                <li>• Recruitment funnel metrics</li>
                <li>• Performance trend analysis</li>
                <li>• Compensation benchmarking</li>
                <li>• Attendance pattern insights</li>
                <li>• Predictive analytics</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-green-500" />
                Workflow Automation
              </CardTitle>
              <CardDescription>
                Streamlined HR processes and approvals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Automated onboarding workflows</li>
                <li>• Multi-level approval chains</li>
                <li>• Document routing and tracking</li>
                <li>• Performance review automation</li>
                <li>• Leave approval workflows</li>
                <li>• Compliance monitoring</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-500" />
                Employee Experience
              </CardTitle>
              <CardDescription>
                Enhanced employee engagement and satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Self-service employee portal</li>
                <li>• Mobile app access</li>
                <li>• Feedback and survey tools</li>
                <li>• Career development tracking</li>
                <li>• Recognition and rewards</li>
                <li>• Employee wellness programs</li>
              </ul>
            </CardContent>
          </Card>
        </div>
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