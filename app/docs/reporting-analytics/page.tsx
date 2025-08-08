'use client';

import { BarChart3, TrendingUp, FileText, Download, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportingAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Reporting & Analytics
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          SPT Teams provides comprehensive reporting and analytics capabilities with dynamic report templates, 
          real-time dashboards, and AI-powered insights across your organization.
        </p>
      </div>

      {/* Core Features */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📊 Core Features</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Dynamic Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create custom reports with dynamic templates and real-time data integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interactive dashboards with real-time metrics and performance indicators.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Cross-Workspace Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aggregate data and insights across multiple workspaces for comprehensive analysis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Advanced Filtering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Filter and drill down into specific data sets with advanced filtering options.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export reports in multiple formats including PDF, Excel, and CSV.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Real-Time Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get real-time insights and alerts based on your organization&apos;s data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="space-y-6 p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <h2 className="text-3xl font-bold">📖 Documentation Coming Soon</h2>
        <p className="text-muted-foreground">
          We&apos;re working on comprehensive documentation for the Reporting & Analytics features. 
          This section will include detailed guides on:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Creating and managing report templates</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Setting up analytics dashboards</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Cross-workspace reporting configuration</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span>Advanced filtering and data visualization</span>
            </li>
          </ul>
          
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Automated report scheduling</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Performance metrics and KPIs</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Data export and integration</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
              <span>Real-time analytics and alerts</span>
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <Button asChild variant="outline">
            <Link href="/docs/ai-assistant">
              <BarChart3 className="mr-2 h-4 w-4" />
              Explore AI-Powered Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Related Documentation */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 Related Documentation</h2>
        <p className="text-muted-foreground">
          While we prepare the detailed reporting documentation, you can explore these related topics:
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/ai-assistant" className="hover:text-primary transition-colors">
                  AI Assistant Analytics
                </Link>
              </CardTitle>
              <CardDescription>
                Learn about AI-powered insights and performance analytics
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
                <Link href="/docs/financial-management" className="hover:text-primary transition-colors">
                  Financial Reporting
                </Link>
              </CardTitle>
              <CardDescription>
                Comprehensive financial reports and budget analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/financial-management">View Guide</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/docs/hr-management" className="hover:text-primary transition-colors">
                  HR Analytics
                </Link>
              </CardTitle>
              <CardDescription>
                Workforce analytics and employee performance reporting
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
                <Link href="/docs/team-management" className="hover:text-primary transition-colors">
                  Team Performance
                </Link>
              </CardTitle>
              <CardDescription>
                Team analytics and collaboration metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/team-management">View Guide</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}