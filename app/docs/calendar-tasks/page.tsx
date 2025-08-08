'use client';

import { Calendar, Clock, CheckSquare, Bell, Users, Repeat } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarTasksPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Calendar & Tasks
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          SPT Teams provides comprehensive calendar management and task tracking features 
          with intelligent scheduling, automated reminders, and team coordination.
        </p>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📅 Core Features</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Calendar Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive calendar system with event scheduling and management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Task Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, assign, and track tasks with deadlines and priorities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track time spent on tasks and projects with detailed analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Smart Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automated reminders and notifications for events and deadlines.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Coordination
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coordinate team schedules and shared calendar events.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-primary" />
                Recurring Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up recurring events and automated task scheduling.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-3xl font-bold">📖 Documentation Coming Soon</h2>
        <p className="text-muted-foreground">
          We&apos;re developing comprehensive documentation for Calendar & Tasks features. 
          This section will include detailed guides on:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Creating and managing calendar events</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Task creation, assignment, and tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Setting up recurring events and tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Time tracking and productivity monitoring</span>
            </li>
          </ul>
          
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Team calendar coordination</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Notification and reminder settings</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Calendar integration with other tools</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Task analytics and reporting</span>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <Button asChild variant="outline">
            <Link href="/docs/team-management">
              <Calendar className="mr-2 h-4 w-4" />
              Explore Team Coordination
            </Link>
          </Button>
        </div>
      </div>

      {/* Related Documentation */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 Related Documentation</h2>
        <p className="text-muted-foreground">
          While we prepare the detailed calendar and tasks documentation, explore these related topics:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/team-management" className="hover:text-primary transition-colors">
                  Team Coordination
                </Link>
              </CardTitle>
              <CardDescription>
                Learn about team collaboration and coordination features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/team-management">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">
                  AI Scheduling
                </Link>
              </CardTitle>
              <CardDescription>
                Discover AI-powered scheduling and productivity recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/ai-assistant">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/hr-management" className="hover:text-primary transition-colors">
                  HR Calendar Integration
                </Link>
              </CardTitle>
              <CardDescription>
                Understand how calendars integrate with HR and attendance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/hr-management">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/roles-and-permissions" className="hover:text-primary transition-colors">
                  Calendar Permissions
                </Link>
              </CardTitle>
              <CardDescription>
                Learn about calendar and task permissions and access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/roles-and-permissions">View Guide</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}