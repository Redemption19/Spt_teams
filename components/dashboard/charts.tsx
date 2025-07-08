'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';

const taskData = [
  { name: 'Mon', completed: 12, created: 8 },
  { name: 'Tue', completed: 19, created: 14 },
  { name: 'Wed', completed: 15, created: 11 },
  { name: 'Thu', completed: 22, created: 16 },
  { name: 'Fri', completed: 18, created: 13 },
  { name: 'Sat', completed: 8, created: 5 },
  { name: 'Sun', completed: 6, created: 4 },
];

const productivityData = [
  { name: 'Design', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Development', value: 45, color: 'hsl(var(--chart-2))' },
  { name: 'Testing', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Documentation', value: 5, color: 'hsl(var(--chart-4))' },
];

const branchData = [
  { name: 'Central', tasks: 45, completed: 32 },
  { name: 'North', tasks: 38, completed: 28 },
  { name: 'South', tasks: 42, completed: 35 },
  { name: 'East', tasks: 35, completed: 25 },
  { name: 'West', tasks: 28, completed: 22 },
];

export function DashboardCharts() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-enhanced border border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Task Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
              <TabsContent value="week" className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={taskData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="stroke-muted-foreground" fontSize={12} />
                    <YAxis className="stroke-muted-foreground" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                        color: '#f9fafb',
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
                      dataKey="completed" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="created" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--accent))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="card-enhanced border border-border/30">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Team Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={productivityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {productivityData.map((entry, index) => (
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
              <div className="grid grid-cols-2 gap-4">
                {productivityData.map((item, index) => (
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
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-enhanced border border-border/30">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Branch Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="stroke-muted-foreground" fontSize={12} />
              <YAxis className="stroke-muted-foreground" fontSize={12} />
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
    </div>
  );
}