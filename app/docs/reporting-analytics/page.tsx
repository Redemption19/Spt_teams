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

      {/* Report Templates */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📋 Report Templates</h2>
        <p className="text-muted-foreground">
          Create and manage custom report templates with pre-built options for common metrics and fully customizable templates for specific needs.
        </p>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pre-built Templates</CardTitle>
              <CardDescription>
                Ready-to-use templates for common reporting scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Team Performance Report</p>
                    <p className="text-sm text-muted-foreground">Track team productivity, task completion rates, and performance metrics</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Project Status Report</p>
                    <p className="text-sm text-muted-foreground">Monitor project progress, milestones, and resource allocation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Financial Summary Report</p>
                    <p className="text-sm text-muted-foreground">Comprehensive financial overview with budget analysis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Templates</CardTitle>
              <CardDescription>
                Build your own templates with drag-and-drop components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Visual Report Builder</p>
                    <p className="text-sm text-muted-foreground">Drag-and-drop interface for creating custom layouts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Dynamic Data Sources</p>
                    <p className="text-sm text-muted-foreground">Connect multiple data sources and apply real-time filters</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Template Sharing</p>
                    <p className="text-sm text-muted-foreground">Share templates across teams and workspaces</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h3 className="text-xl font-semibold mb-3">Getting Started with Report Templates</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="font-medium">1. Choose a Template</p>
              <p className="text-sm text-muted-foreground">Select from pre-built templates or create a custom one</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Configure Data Sources</p>
              <p className="text-sm text-muted-foreground">Connect your data sources and set up filters</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">3. Customize Layout</p>
              <p className="text-sm text-muted-foreground">Arrange components and customize styling</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">4. Schedule & Share</p>
              <p className="text-sm text-muted-foreground">Set up automated generation and distribution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboards */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📊 Analytics Dashboards</h2>
        <p className="text-muted-foreground">
          Interactive dashboards with real-time metrics, customizable widgets, and comprehensive performance indicators for all organizational levels.
        </p>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Individual Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Personal productivity metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Task completion rates
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Time tracking insights
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Goal progress tracking
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Team Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Team performance overview
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Project status summaries
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Resource utilization
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Collaboration metrics
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Executive Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Organization-wide KPIs
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Financial performance
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Strategic goal tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Risk assessment metrics
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20">
          <h3 className="text-xl font-semibold mb-3">Dashboard Features</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Real-Time Updates</h4>
                <p className="text-sm text-muted-foreground">Live data synchronization with automatic refresh intervals and instant notifications for critical changes.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Customizable Widgets</h4>
                <p className="text-sm text-muted-foreground">Drag-and-drop widget arrangement with resizable components and personalized layouts.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Interactive Charts</h4>
                <p className="text-sm text-muted-foreground">Click-through analytics with drill-down capabilities and dynamic filtering options.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Mobile Responsive</h4>
                <p className="text-sm text-muted-foreground">Optimized for all devices with touch-friendly controls and adaptive layouts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Workspace Reporting */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🌐 Cross-Workspace Reporting</h2>
        <p className="text-muted-foreground">
          Aggregate data and insights across multiple workspaces for comprehensive organizational analysis and multi-level reporting.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Level Analytics</CardTitle>
              <CardDescription>
                Hierarchical reporting across branches, regions, and teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Branch Comparisons</p>
                  <p className="text-sm text-muted-foreground">Compare performance metrics across different branches</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Regional Analytics</p>
                  <p className="text-sm text-muted-foreground">Region-wide performance tracking and resource allocation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Organization-wide KPIs</p>
                  <p className="text-sm text-muted-foreground">Comprehensive organizational performance indicators</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Aggregation</CardTitle>
              <CardDescription>
                Intelligent data consolidation and normalization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Smart Data Merging</p>
                  <p className="text-sm text-muted-foreground">Automatic data consolidation from multiple sources</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unified Metrics</p>
                  <p className="text-sm text-muted-foreground">Standardized metrics across all workspaces</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <div>
                  <p className="font-medium">Historical Trends</p>
                  <p className="text-sm text-muted-foreground">Long-term trend analysis across organizational units</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Filtering & Data Visualization */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔍 Advanced Filtering & Data Visualization</h2>
        <p className="text-muted-foreground">
          Powerful filtering capabilities and interactive data visualization tools for deep insights and comprehensive analysis.
        </p>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Dynamic Filtering
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Multi-Dimensional Filters</p>
                  <p className="text-sm text-muted-foreground">Filter by time, location, team, project, or custom criteria</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Saved Filter Sets</p>
                  <p className="text-sm text-muted-foreground">Save and share commonly used filter combinations</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Real-Time Filtering</p>
                  <p className="text-sm text-muted-foreground">Instant results as you adjust filter parameters</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drill-Down Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Interactive Charts</p>
                  <p className="text-sm text-muted-foreground">Click through data points for detailed breakdowns</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Hierarchical Navigation</p>
                  <p className="text-sm text-muted-foreground">Navigate from high-level summaries to detailed records</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualization Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Bar Charts
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Line Graphs
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Pie Charts
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Heat Maps
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Scatter Plots
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Gantt Charts
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Treemaps
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Dashboards
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Visualizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="font-medium">Chart Builder</p>
                  <p className="text-sm text-muted-foreground">Create custom charts with drag-and-drop interface</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Color Themes</p>
                  <p className="text-sm text-muted-foreground">Customize colors and styling to match your brand</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Automated Report Scheduling */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">⏰ Automated Report Scheduling</h2>
        <p className="text-muted-foreground">
          Schedule automated report generation and distribution with flexible timing options and intelligent delivery systems.
        </p>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Daily reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Weekly summaries</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Monthly reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Quarterly reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Custom intervals</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Email delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Dashboard notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Slack integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Teams integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">API webhooks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Conditional delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Threshold alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Failure notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Retry mechanisms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Delivery confirmation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h3 className="text-xl font-semibold mb-3">Setting Up Automated Reports</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <p className="font-medium">1. Select Template</p>
              <p className="text-sm text-muted-foreground">Choose your report template and configure data sources</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Set Schedule</p>
              <p className="text-sm text-muted-foreground">Define frequency, timing, and delivery preferences</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">3. Configure Recipients</p>
              <p className="text-sm text-muted-foreground">Add recipients and set delivery methods</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">4. Test & Activate</p>
              <p className="text-sm text-muted-foreground">Test delivery and activate the schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics & KPIs */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📈 Performance Metrics & KPIs</h2>
        <p className="text-muted-foreground">
          Comprehensive performance tracking with individual, team, and organizational key performance indicators for data-driven decision making.
        </p>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Individual Metrics</CardTitle>
              <CardDescription>
                Personal productivity and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Task completion rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Time tracking efficiency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Goal achievement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Quality scores</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Collaboration index</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Metrics</CardTitle>
              <CardDescription>
                Team performance and collaboration indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Team velocity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Project delivery rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Resource utilization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Communication frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Sprint success rate</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizational KPIs</CardTitle>
              <CardDescription>
                Enterprise-level performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Revenue per employee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Customer satisfaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Employee engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Operational efficiency</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">Strategic goal progress</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20">
          <h3 className="text-xl font-semibold mb-3">KPI Management Best Practices</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">SMART Goals Framework</h4>
                <p className="text-sm text-muted-foreground">Set Specific, Measurable, Achievable, Relevant, and Time-bound objectives for all performance metrics.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Regular Review Cycles</h4>
                <p className="text-sm text-muted-foreground">Establish consistent review periods to assess progress and adjust targets based on performance trends.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Benchmarking</h4>
                <p className="text-sm text-muted-foreground">Compare performance against industry standards and historical data to maintain competitive advantage.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Actionable Insights</h4>
                <p className="text-sm text-muted-foreground">Focus on metrics that drive decision-making and provide clear paths for improvement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export & Integration */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">📤 Data Export & Integration</h2>
        <p className="text-muted-foreground">
          Seamless data export capabilities and API integrations for connecting with external tools and maintaining data consistency across platforms.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Formats
              </CardTitle>
              <CardDescription>
                Multiple export options for different use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">PDF Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Excel Spreadsheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">CSV Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">JSON API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">PowerBI Connector</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-sm">Tableau Integration</span>
                </div>
              </div>
              <div className="pt-3">
                <h4 className="font-medium mb-2">Bulk Export Features</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Scheduled bulk exports</li>
                  <li>• Custom date range selection</li>
                  <li>• Filtered data exports</li>
                  <li>• Compressed file delivery</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>
                RESTful APIs for seamless third-party connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-1">Real-Time Data Access</h4>
                  <p className="text-sm text-muted-foreground">Live API endpoints for real-time data synchronization</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Webhook Support</h4>
                  <p className="text-sm text-muted-foreground">Event-driven notifications for data changes</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Authentication & Security</h4>
                  <p className="text-sm text-muted-foreground">OAuth 2.0 and API key authentication</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">Intelligent rate limiting for optimal performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h3 className="text-xl font-semibold mb-3">Popular Integrations</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="font-medium">Business Intelligence</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Microsoft Power BI</div>
                <div>• Tableau</div>
                <div>• Google Data Studio</div>
                <div>• Looker</div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Productivity Tools</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Microsoft 365</div>
                <div>• Google Workspace</div>
                <div>• Slack</div>
                <div>• Microsoft Teams</div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Development Tools</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• GitHub</div>
                <div>• Jira</div>
                <div>• Azure DevOps</div>
                <div>• GitLab</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Analytics & Alerts */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🚨 Real-Time Analytics & Alerts</h2>
        <p className="text-muted-foreground">
          Live insights and intelligent alert systems that keep you informed of critical changes and performance thresholds in real-time.
        </p>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Live Monitoring
              </CardTitle>
              <CardDescription>
                Real-time data streaming and live dashboard updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Live Data Streams</p>
                    <p className="text-sm text-muted-foreground">Real-time data updates with sub-second latency</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Auto-Refresh Dashboards</p>
                    <p className="text-sm text-muted-foreground">Configurable refresh intervals for live insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Performance Monitoring</p>
                    <p className="text-sm text-muted-foreground">System health and performance tracking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Activity Feeds</p>
                    <p className="text-sm text-muted-foreground">Live activity streams across all workspaces</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Intelligent notification system with customizable triggers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Threshold Alerts</p>
                    <p className="text-sm text-muted-foreground">Automatic notifications when metrics exceed limits</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Anomaly Detection</p>
                    <p className="text-sm text-muted-foreground">AI-powered detection of unusual patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Custom Triggers</p>
                    <p className="text-sm text-muted-foreground">User-defined conditions for personalized alerts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Multi-Channel Delivery</p>
                    <p className="text-sm text-muted-foreground">Email, SMS, Slack, and in-app notifications</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Alert Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>Critical system alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  <span>Performance warnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>Goal achievements</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Milestone completions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>Custom notifications</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>In-app notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Email alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>SMS messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Slack integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Teams integration</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Priority levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Escalation rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Snooze options</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Alert history</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Acknowledgment tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Documentation */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">🔗 Related Documentation</h2>
        <p className="text-muted-foreground">
          Explore these related topics to maximize your reporting and analytics capabilities:
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