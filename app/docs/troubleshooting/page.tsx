'use client';

import { AlertTriangle, HelpCircle, Search, Settings, Wifi, Lock, RefreshCw, MessageCircle, Mail, Phone, ExternalLink, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function TroubleshootingPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Troubleshooting & FAQs
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Find quick solutions to common issues and get answers to frequently asked questions about SPT Teams.
        </p>
      </div>

      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search for solutions, error messages, or topics..." 
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Emergency Support */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Need Immediate Help?</AlertTitle>
        <AlertDescription>
          For critical issues affecting your business operations, contact our emergency support team at support@sptteams.com or use the live chat feature.
        </AlertDescription>
      </Alert>

      {/* Common Issues */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-primary" />
          Common Issues & Solutions
        </h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-red-500" />
                Connection Issues
              </CardTitle>
              <CardDescription>
                Problems with connectivity and sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Check internet connection</li>
                <li>• Clear browser cache</li>
                <li>• Disable VPN temporarily</li>
                <li>• Try incognito/private mode</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                Login Problems
              </CardTitle>
              <CardDescription>
                Authentication and access issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Reset password</li>
                <li>• Check email for verification</li>
                <li>• Verify account status</li>
                <li>• Contact administrator</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                Sync Issues
              </CardTitle>
              <CardDescription>
                Data synchronization problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Force refresh (Ctrl+F5)</li>
                <li>• Check sync status</li>
                <li>• Verify permissions</li>
                <li>• Wait for auto-sync</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                Performance Issues
              </CardTitle>
              <CardDescription>
                Slow loading and responsiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Close unused browser tabs</li>
                <li>• Update browser</li>
                <li>• Check system resources</li>
                <li>• Disable browser extensions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                Notification Issues
              </CardTitle>
              <CardDescription>
                Missing or delayed notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Check notification settings</li>
                <li>• Allow browser notifications</li>
                <li>• Verify email settings</li>
                <li>• Check spam folder</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-indigo-500" />
                Integration Problems
              </CardTitle>
              <CardDescription>
                Third-party service connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Verify API credentials</li>
                <li>• Check service status</li>
                <li>• Reconnect integration</li>
                <li>• Review permissions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          Frequently Asked Questions
        </h2>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is SPT Teams and how does it work?</AccordionTrigger>
                <AccordionContent>
                  SPT Teams is a comprehensive workspace management platform that combines project management, team collaboration, document management, and business intelligence tools. It works by providing a centralized hub where teams can manage their work, communicate effectively, and track progress across all projects and initiatives.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I get started with SPT Teams?</AccordionTrigger>
                <AccordionContent>
                  Getting started is easy! Sign up for an account, create your organization, invite team members, and set up your first workspace. Our onboarding guide will walk you through each step, and you can access it from the Getting Started section in our documentation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Can I import data from other tools?</AccordionTrigger>
                <AccordionContent>
                  Yes! SPT Teams supports data import from popular tools like Trello, Asana, Slack, Google Workspace, and Microsoft 365. We provide import wizards and migration assistance to help you transition smoothly from your existing tools.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Is my data secure with SPT Teams?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. We implement enterprise-grade security measures including end-to-end encryption, SOC 2 compliance, GDPR compliance, regular security audits, and advanced access controls. Your data is stored in secure, geographically distributed data centers.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="account-1">
                <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                <AccordionContent>
                  Click the &quot;Forgot Password&quot; link on the login page, enter your email address, and follow the instructions in the reset email. If you don&apos;t receive the email within 5 minutes, check your spam folder or contact support.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="account-2">
                <AccordionTrigger>Can I change my email address?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can update your email address in your account settings. Go to Profile Settings &gt; Account Information &gt; Email Address. You&apos;ll need to verify the new email address before the change takes effect.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="account-3">
                <AccordionTrigger>How do I delete my account?</AccordionTrigger>
                <AccordionContent>
                  Account deletion can be requested through your account settings or by contacting our support team. Please note that this action is irreversible and will permanently delete all your data. We recommend exporting important data before deletion.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="account-4">
                <AccordionTrigger>Can I have multiple organizations under one account?</AccordionTrigger>
                <AccordionContent>
                  Yes, a single user account can be associated with multiple organizations. You can switch between organizations using the organization selector in the top navigation bar.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="billing" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="billing-1">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can also arrange for invoice-based billing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="billing-2">
                <AccordionTrigger>Can I change my plan at any time?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle. Any prorated charges or credits will be applied to your next invoice.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="billing-3">
                <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
                <AccordionContent>
                  We offer a 30-day money-back guarantee for new subscriptions. For existing customers, refunds are considered on a case-by-case basis. Please contact our billing team to discuss your specific situation.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="billing-4">
                <AccordionTrigger>How does user billing work?</AccordionTrigger>
                <AccordionContent>
                  Billing is based on active users in your organization. You&apos;re charged for the number of users who have accessed the platform in the current billing period. Inactive users (those who haven&apos;t logged in for 30+ days) are not counted toward your bill.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="technical" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tech-1">
                <AccordionTrigger>What browsers are supported?</AccordionTrigger>
                <AccordionContent>
                  SPT Teams works best on modern browsers including Chrome (latest 2 versions), Firefox (latest 2 versions), Safari (latest 2 versions), and Edge (latest 2 versions). We recommend keeping your browser updated for the best experience.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tech-2">
                <AccordionTrigger>Is there a mobile app available?</AccordionTrigger>
                <AccordionContent>
                  Yes! SPT Teams mobile apps are available for both iOS and Android devices. You can download them from the App Store or Google Play Store. The mobile apps provide full access to your workspaces, projects, and team collaboration features.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tech-3">
                <AccordionTrigger>Can I use SPT Teams offline?</AccordionTrigger>
                <AccordionContent>
                  SPT Teams requires an internet connection for most features. However, our mobile apps offer limited offline functionality for viewing recently accessed content. Any changes made offline will sync when you reconnect to the internet.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tech-4">
                <AccordionTrigger>What integrations are available?</AccordionTrigger>
                <AccordionContent>
                  We offer 100+ integrations including Google Workspace, Microsoft 365, Slack, Zoom, GitHub, Jira, Salesforce, and many more. You can find the complete list in our integrations directory or contact us about custom integrations.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* System Status */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          System Status
        </h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">API Services</p>
                  <p className="text-sm text-muted-foreground">Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Web Application</p>
                  <p className="text-sm text-muted-foreground">Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">File Storage</p>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Button asChild variant="outline">
          <Link href="https://status.sptteams.com" target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Full Status Page
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Contact Support */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Contact Support</h2>
        
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Live Chat
              </CardTitle>
              <CardDescription>
                Get instant help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Available 24/7 for urgent issues, business hours for general support.
              </p>
              <Button className="w-full">
                Start Chat
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-500" />
                Email Support
              </CardTitle>
              <CardDescription>
                Send us a detailed message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Response within 4 hours during business hours.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="mailto:support@sptteams.com">
                  Send Email
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-purple-500" />
                Phone Support
              </CardTitle>
              <CardDescription>
                Speak directly with our team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Available for Enterprise customers during business hours.
              </p>
              <Button variant="outline" className="w-full">
                Request Callback
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/docs/getting-started">
              Getting Started Guide
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs/security">
              Security Documentation
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs">
              All Documentation
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}