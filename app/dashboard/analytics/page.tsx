'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Calendar, TrendingUp, Users, Target } from 'lucide-react';

const performanceData = [
  { month: 'Jan', productivity: 78, tasks: 145, efficiency: 82 },
  { month: 'Feb', productivity: 82, tasks: 167, efficiency: 85 },
  { month: 'Mar', productivity: 79, tasks: 189, efficiency: 80 },
  { month: 'Apr', productivity: 85, tasks: 201, efficiency: 88 },
  { month: 'May', productivity: 91, tasks: 234, efficiency: 92 },
  { month: 'Jun', productivity: 89, tasks: 256, efficiency: 90 },
];

const teamDistribution = [
  { name: 'Frontend', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Backend', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Design', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'QA', value: 15, color: 'hsl(var(--chart-4))' },
];

const branchMetrics = [
  { branch: 'Central', tasks: 89, completed: 76, efficiency: 85 },
  { branch: 'North', tasks: 73, completed: 61, efficiency: 84 },
  { branch: 'South', tasks: 81, completed: 70, efficiency: 86 },
  { branch: 'East', tasks: 65, completed: 52, efficiency: 80 },
  { branch: 'West', tasks: 58, completed: 47, efficiency: 81 },
];

const productivityTrend = [
  { week: 'W1', individual: 75, team: 78 },
  { week: 'W2', individual: 78, team: 82 },
  { week: 'W3', individual: 82, team: 85 },
  { week: 'W4', individual: 85, team: 88 },
  { week: 'W5', individual: 88, team: 91 },
  { week: 'W6', individual: 91, team: 94 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into team performance and productivity</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select defaultValue="last-30-days">
            <SelectTrigger className="w-40 border-border">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stats-card border border-border/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Avg Productivity</p>
                <p className="text-2xl font-bold text-foreground">89%</p>
                <p className="text-xs text-green-600 dark:text-green-400">+5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card border border-border/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Task Completion</p>
                <p className="text-2xl font-bold text-foreground">92%</p>
                <p className="text-xs text-green-600 dark:text-green-400">+3% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card border border-border/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Users</p>
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">+2 this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card border border-border/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Projects Active</p>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">3 due this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card className="card-enhanced border border-border/30">
            <CardHeader>
              <CardTitle>Monthly Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="stroke-muted-foreground" />
                  <YAxis className="stroke-muted-foreground" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '12px 16px',
                    }}
                    labelStyle={{
                      color: '#f9fafb',
                      fontWeight: '600',
                      marginBottom: '4px',
                    }}
                    itemStyle={{
                      color: '#f9fafb',
                    }}
                  />
                  <Area type="monotone" dataKey="productivity" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="efficiency" stackId="2" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-enhanced border border-border/30">
              <CardHeader>
                <CardTitle>Team Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={teamDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {teamDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px 16px',
                      }}
                      labelStyle={{
                        color: '#f9fafb',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                      itemStyle={{
                        color: '#f9fafb',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {teamDistribution.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="text-sm font-medium ml-auto text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="card-enhanced border border-border/30">
              <CardHeader>
                <CardTitle>Productivity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" className="stroke-muted-foreground" />
                    <YAxis className="stroke-muted-foreground" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px 16px',
                      }}
                      labelStyle={{
                        color: '#f9fafb',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                      itemStyle={{
                        color: '#f9fafb',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="individual" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="team" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Card className="card-enhanced border border-border/30">
            <CardHeader>
              <CardTitle>Branch Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={branchMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="branch" className="stroke-muted-foreground" />
                  <YAxis className="stroke-muted-foreground" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '12px 16px',
                    }}
                    labelStyle={{
                      color: '#f9fafb',
                      fontWeight: '600',
                      marginBottom: '4px',
                    }}
                    itemStyle={{
                      color: '#f9fafb',
                    }}
                  />
                  <Bar dataKey="tasks" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6">
            <Card className="card-enhanced border border-border/30">
              <CardHeader>
                <CardTitle>Task Creation vs Completion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="stroke-muted-foreground" />
                    <YAxis className="stroke-muted-foreground" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '12px 16px',
                      }}
                      labelStyle={{
                        color: '#f9fafb',
                        fontWeight: '600',
                        marginBottom: '4px',
                      }}
                      itemStyle={{
                        color: '#f9fafb',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasks" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Tasks Created"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      name="Completion Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}