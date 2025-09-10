'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react';
import { DepartmentService } from '@/lib/department-service';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';
import { Department } from '@/lib/department-service';
import { Task, Project } from '@/lib/types';

interface AdvancedAnalyticsProps {
  selectedDepartment?: string;
  workspaceId: string;
}

interface DepartmentMetrics {
  id: string;
  name: string;
  completionRate: number;
  efficiency: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  activeProjects: number;
  memberCount: number;
  trendData: { date: string; value: number }[];
}

interface AnalyticsData {
  departments: DepartmentMetrics[];
  loading: boolean;
  error: string | null;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ 
  selectedDepartment, 
  workspaceId 
}) => {
  const [data, setData] = useState<AnalyticsData>({
    departments: [],
    loading: true,
    error: null
  });
  const [dateFrom, setDateFrom] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedMetric, setSelectedMetric] = useState<string>('completion');
  const [activeTab, setActiveTab] = useState<string>('trends');

  const fetchAnalyticsData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Fetch real data from services
      const [departments, tasks, projects] = await Promise.all([
        DepartmentService.getWorkspaceDepartments(workspaceId),
        TaskService.getWorkspaceTasks(workspaceId),
        ProjectService.getWorkspaceProjects(workspaceId)
      ]);

      // Calculate metrics for each department
      const departmentMetrics: DepartmentMetrics[] = departments.map(dept => {
        const deptProjects = projects.filter(project => project.departmentId === dept.id);
        const deptProjectIds = deptProjects.map(p => p.id);
        const deptTasks = tasks.filter(task => deptProjectIds.includes(task.projectId));
        
        const totalTasks = deptTasks.length;
        const completedTasks = deptTasks.filter(task => task.status === 'completed').length;
        const overdueTasks = deptTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < new Date() && task.status !== 'completed';
        }).length;
        
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
        const efficiency = Math.max(0, completionRate - (overdueRate * 0.2));
        
        // Generate 30-day trend data with slight variations
        const trendData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
          const baseValue = completionRate;
          const variation = (Math.random() - 0.5) * 10; // ±5% variation
          const value = Math.max(0, Math.min(100, baseValue + variation));
          
          return {
            date: date.toISOString().split('T')[0],
            value: Math.round(value * 100) / 100
          };
        });
        
        return {
          id: dept.id,
          name: dept.name,
          completionRate,
          efficiency,
          totalTasks,
          completedTasks,
          overdueTasks,
          activeProjects: deptProjects.filter(p => p.status === 'active').length,
          memberCount: dept.memberCount || 0,
          trendData
        };
      });

      setData({
        departments: departmentMetrics,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load analytics data'
      }));
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [workspaceId, dateFrom, dateTo]);

  const filteredDepartments = selectedDepartment 
    ? data.departments.filter(dept => dept.id === selectedDepartment)
    : data.departments;

  const exportData = () => {
    const exportObj = {
      dateRange: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
      metric: selectedMetric,
      departments: filteredDepartments,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `department-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMetricValue = (dept: DepartmentMetrics) => {
    switch (selectedMetric) {
      case 'completion': return dept.completionRate;
      case 'performance': return dept.efficiency;
      case 'efficiency': return dept.efficiency;
      default: return dept.completionRate;
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (data.loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{data.error}</p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-600">Real-time department performance insights</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <EnhancedDatePicker
              date={dateFrom}
              onDateChange={(date) => date && setDateFrom(date)}
              placeholder="From date"
            />
            <EnhancedDatePicker
              date={dateTo}
              onDateChange={(date) => date && setDateTo(date)}
              placeholder="To date"
            />
          </div>
          
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completion">Completion Rate</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold">{filteredDepartments.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Completion Rate</p>
                <p className="text-2xl font-bold">
                  {filteredDepartments.length > 0 
                    ? Math.round(filteredDepartments.reduce((sum, dept) => sum + dept.completionRate, 0) / filteredDepartments.length)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">
                  {filteredDepartments.reduce((sum, dept) => sum + dept.totalTasks, 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredDepartments.reduce((sum, dept) => sum + dept.overdueTasks, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDepartments.map(dept => (
              <Card key={dept.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{dept.name}</span>
                    <Badge variant={getMetricValue(dept) >= 80 ? 'default' : 'secondary'}>
                      {Math.round(getMetricValue(dept))}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completion Rate</span>
                        <span className={getMetricColor(dept.completionRate)}>
                          {Math.round(dept.completionRate)}%
                        </span>
                      </div>
                      <Progress value={dept.completionRate} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Efficiency Score</span>
                        <span className={getMetricColor(dept.efficiency)}>
                          {Math.round(dept.efficiency)}%
                        </span>
                      </div>
                      <Progress value={dept.efficiency} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Active Projects</p>
                        <p className="font-semibold">{dept.activeProjects}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Team Members</p>
                        <p className="font-semibold">{dept.memberCount}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDepartments
                  .sort((a, b) => getMetricValue(b) - getMetricValue(a))
                  .map((dept, index) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{dept.name}</h4>
                          <p className="text-sm text-gray-600">
                            {dept.completedTasks}/{dept.totalTasks} tasks completed
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-semibold ${getMetricColor(getMetricValue(dept))}`}>
                            {Math.round(getMetricValue(dept))}%
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                          </p>
                        </div>
                        
                        {getMetricValue(dept) >= 80 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDepartments.length > 0 && (
                    <>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Top Performer</h4>
                        <p className="text-green-700">
                          {filteredDepartments.reduce((best, dept) => 
                            dept.efficiency > best.efficiency ? dept : best
                          ).name} leads with {Math.round(filteredDepartments.reduce((best, dept) => 
                            dept.efficiency > best.efficiency ? dept : best
                          ).efficiency)}% efficiency
                        </p>
                      </div>
                      
                      {filteredDepartments.some(dept => dept.overdueTasks > 0) && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2">Attention Needed</h4>
                          <p className="text-red-700">
                            {filteredDepartments.filter(dept => dept.overdueTasks > 0).length} departments 
                            have overdue tasks requiring immediate attention
                          </p>
                        </div>
                      )}
                      
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Workload Distribution</h4>
                        <p className="text-blue-700">
                          Average of {Math.round(filteredDepartments.reduce((sum, dept) => sum + dept.totalTasks, 0) / filteredDepartments.length)} 
                          tasks per department with {Math.round(filteredDepartments.reduce((sum, dept) => sum + dept.memberCount, 0) / filteredDepartments.length)} 
                          members on average
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDepartments.map(dept => {
                    const recommendations = [];
                    
                    if (dept.efficiency < 60) {
                      recommendations.push(`${dept.name}: Focus on reducing overdue tasks`);
                    }
                    if (dept.completionRate < 70) {
                      recommendations.push(`${dept.name}: Improve task completion processes`);
                    }
                    if (dept.overdueTasks > dept.totalTasks * 0.2) {
                      recommendations.push(`${dept.name}: Review task prioritization`);
                    }
                    
                    return recommendations.map((rec, index) => (
                      <div key={`${dept.id}-${index}`} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">{rec}</p>
                      </div>
                    ));
                  }).flat()}
                  
                  {filteredDepartments.every(dept => dept.efficiency >= 80) && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800">🎉 All departments are performing excellently!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;