'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Bell, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  X
} from 'lucide-react';
import { DepartmentService } from '@/lib/department-service';
import { TaskService } from '@/lib/task-service';
import { ProjectService } from '@/lib/project-service';

interface KPIManagementProps {
  selectedDepartment?: string;
  workspaceId: string;
}

interface KPI {
  id: string;
  name: string;
  description: string;
  metric: 'completion_rate' | 'efficiency' | 'overdue_tasks' | 'project_count' | 'member_productivity';
  target: number;
  currentValue: number;
  unit: '%' | 'count' | 'hours';
  threshold: {
    warning: number;
    critical: number;
  };
  alertsEnabled: boolean;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Alert {
  id: string;
  kpiId: string;
  kpiName: string;
  type: 'warning' | 'critical' | 'success';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface KPIFormData {
  name: string;
  description: string;
  metric: string;
  target: string;
  warningThreshold: string;
  criticalThreshold: string;
  unit: string;
  alertsEnabled: boolean;
  departmentId: string;
}

export const KPIManagement: React.FC<KPIManagementProps> = ({ 
  selectedDepartment, 
  workspaceId 
}) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [formData, setFormData] = useState<KPIFormData>({
    name: '',
    description: '',
    metric: '',
    target: '',
    warningThreshold: '',
    criticalThreshold: '',
    unit: '%',
    alertsEnabled: true,
    departmentId: selectedDepartment || ''
  });

  const metricOptions = [
    { value: 'completion_rate', label: 'Task Completion Rate', unit: '%' },
    { value: 'efficiency', label: 'Department Efficiency', unit: '%' },
    { value: 'overdue_tasks', label: 'Overdue Tasks', unit: 'count' },
    { value: 'project_count', label: 'Active Projects', unit: 'count' },
    { value: 'member_productivity', label: 'Member Productivity', unit: 'hours' }
  ];

  useEffect(() => {
    fetchData();
  }, [workspaceId, selectedDepartment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const deptData = await DepartmentService.getWorkspaceDepartments(workspaceId);
      setDepartments(deptData);
      
      // Load KPIs from localStorage (in a real app, this would be from a backend)
      const savedKPIs = localStorage.getItem(`kpis_${workspaceId}`);
      const kpiData = savedKPIs ? JSON.parse(savedKPIs) : [];
      
      // Calculate current values for KPIs
      const [tasks, projects] = await Promise.all([
        TaskService.getWorkspaceTasks(workspaceId),
        ProjectService.getWorkspaceProjects(workspaceId)
      ]);
      
      const updatedKPIs = await Promise.all(kpiData.map(async (kpi: KPI) => {
        const currentValue = await calculateKPIValue(kpi, tasks, projects, deptData);
        return { ...kpi, currentValue };
      }));
      
      setKpis(updatedKPIs);
      
      // Generate alerts based on KPI values
      generateAlerts(updatedKPIs);
      
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIValue = async (kpi: KPI, tasks: any[], projects: any[], departments: any[]) => {
    const deptTasks = kpi.departmentId 
      ? tasks.filter(task => task.departmentId === kpi.departmentId)
      : tasks;
    const deptProjects = kpi.departmentId 
      ? projects.filter(project => project.departmentId === kpi.departmentId)
      : projects;
    
    // Common calculations used across multiple metrics
    const totalTasks = deptTasks.length;
    const completedTasks = deptTasks.filter(task => task.status === 'completed').length;
    
    switch (kpi.metric) {
      case 'completion_rate':
        return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
      case 'efficiency':
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const overdueTasks = deptTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < new Date() && task.status !== 'completed';
        }).length;
        const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
        return Math.max(0, completionRate - (overdueRate * 0.2));
        
      case 'overdue_tasks':
        return deptTasks.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < new Date() && task.status !== 'completed';
        }).length;
        
      case 'project_count':
        return deptProjects.filter(project => project.status === 'active').length;
        
      case 'member_productivity':
        const dept = departments.find(d => d.id === kpi.departmentId);
        const memberCount = dept?.memberCount || 1;
        const avgTasksPerMember = totalTasks / memberCount;
        return Math.round(avgTasksPerMember * 8); // Assuming 8 hours per task
        
      default:
        return 0;
    }
  };

  const generateAlerts = (kpis: KPI[]) => {
    const newAlerts: Alert[] = [];
    
    kpis.forEach(kpi => {
      if (!kpi.alertsEnabled) return;
      
      let alertType: 'warning' | 'critical' | 'success' | null = null;
      let message = '';
      
      if (kpi.metric === 'overdue_tasks') {
        // For overdue tasks, higher values are worse
        if (kpi.currentValue >= kpi.threshold.critical) {
          alertType = 'critical';
          message = `Critical: ${kpi.name} has ${kpi.currentValue} overdue tasks (threshold: ${kpi.threshold.critical})`;
        } else if (kpi.currentValue >= kpi.threshold.warning) {
          alertType = 'warning';
          message = `Warning: ${kpi.name} has ${kpi.currentValue} overdue tasks (threshold: ${kpi.threshold.warning})`;
        }
      } else {
        // For other metrics, lower values are worse
        if (kpi.currentValue <= kpi.threshold.critical) {
          alertType = 'critical';
          message = `Critical: ${kpi.name} is at ${kpi.currentValue.toFixed(1)}${kpi.unit} (threshold: ${kpi.threshold.critical}${kpi.unit})`;
        } else if (kpi.currentValue <= kpi.threshold.warning) {
          alertType = 'warning';
          message = `Warning: ${kpi.name} is at ${kpi.currentValue.toFixed(1)}${kpi.unit} (threshold: ${kpi.threshold.warning}${kpi.unit})`;
        } else if (kpi.currentValue >= kpi.target) {
          alertType = 'success';
          message = `Success: ${kpi.name} has reached target of ${kpi.target}${kpi.unit}`;
        }
      }
      
      if (alertType) {
        newAlerts.push({
          id: `alert_${kpi.id}_${Date.now()}`,
          kpiId: kpi.id,
          kpiName: kpi.name,
          type: alertType,
          message,
          timestamp: new Date(),
          acknowledged: false
        });
      }
    });
    
    setAlerts(newAlerts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedMetric = metricOptions.find(m => m.value === formData.metric);
    if (!selectedMetric) return;
    
    const kpiData: KPI = {
      id: editingKPI?.id || `kpi_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      metric: formData.metric as KPI['metric'],
      target: parseFloat(formData.target),
      currentValue: 0,
      unit: selectedMetric.unit as KPI['unit'],
      threshold: {
        warning: parseFloat(formData.warningThreshold),
        critical: parseFloat(formData.criticalThreshold)
      },
      alertsEnabled: formData.alertsEnabled,
      departmentId: formData.departmentId || undefined,
      createdAt: editingKPI?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    let updatedKPIs;
    if (editingKPI) {
      updatedKPIs = kpis.map(kpi => kpi.id === editingKPI.id ? kpiData : kpi);
    } else {
      updatedKPIs = [...kpis, kpiData];
    }
    
    setKpis(updatedKPIs);
    localStorage.setItem(`kpis_${workspaceId}`, JSON.stringify(updatedKPIs));
    
    resetForm();
    fetchData(); // Recalculate values
  };

  const handleEdit = (kpi: KPI) => {
    setEditingKPI(kpi);
    setFormData({
      name: kpi.name,
      description: kpi.description,
      metric: kpi.metric,
      target: kpi.target.toString(),
      warningThreshold: kpi.threshold.warning.toString(),
      criticalThreshold: kpi.threshold.critical.toString(),
      unit: kpi.unit,
      alertsEnabled: kpi.alertsEnabled,
      departmentId: kpi.departmentId || ''
    });
    setShowForm(true);
  };

  const handleDelete = (kpiId: string) => {
    const updatedKPIs = kpis.filter(kpi => kpi.id !== kpiId);
    setKpis(updatedKPIs);
    localStorage.setItem(`kpis_${workspaceId}`, JSON.stringify(updatedKPIs));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      metric: '',
      target: '',
      warningThreshold: '',
      criticalThreshold: '',
      unit: '%',
      alertsEnabled: true,
      departmentId: selectedDepartment || ''
    });
    setEditingKPI(null);
    setShowForm(false);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getKPIStatus = (kpi: KPI) => {
    if (kpi.metric === 'overdue_tasks') {
      if (kpi.currentValue >= kpi.threshold.critical) return 'critical';
      if (kpi.currentValue >= kpi.threshold.warning) return 'warning';
      return 'success';
    } else {
      if (kpi.currentValue <= kpi.threshold.critical) return 'critical';
      if (kpi.currentValue <= kpi.threshold.warning) return 'warning';
      if (kpi.currentValue >= kpi.target) return 'success';
      return 'normal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const filteredKPIs = selectedDepartment 
    ? kpis.filter(kpi => kpi.departmentId === selectedDepartment || !kpi.departmentId)
    : kpis;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">KPI Management</h2>
          <p className="text-gray-600">Configure and monitor key performance indicators</p>
        </div>
        
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add KPI
        </Button>
      </div>

      {/* Alerts Banner */}
      {alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-800">Active Alerts</h3>
            </div>
            <div className="space-y-2">
              {alerts.filter(alert => !alert.acknowledged).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    {alert.type === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKPIs.map(kpi => {
              const status = getKPIStatus(kpi);
              const progress = kpi.metric === 'overdue_tasks' 
                ? Math.min(100, (kpi.currentValue / Math.max(kpi.threshold.critical, 1)) * 100)
                : Math.min(100, (kpi.currentValue / kpi.target) * 100);
              
              return (
                <Card key={kpi.id} className={`border-2 ${getStatusColor(status)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{kpi.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {status === 'success' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {status === 'critical' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(kpi)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{kpi.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {kpi.currentValue.toFixed(1)}{kpi.unit}
                        </span>
                        <Badge variant={status === 'success' ? 'default' : 'secondary'}>
                          Target: {kpi.target}{kpi.unit}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Warning: {kpi.threshold.warning}{kpi.unit} | 
                        Critical: {kpi.threshold.critical}{kpi.unit}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredKPIs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No KPIs configured</h3>
                <p className="text-gray-600 mb-4">Start by creating your first KPI to track department performance</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create KPI
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="configure" className="space-y-4">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingKPI ? 'Edit KPI' : 'Create New KPI'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">KPI Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Task Completion Rate"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="metric">Metric Type</Label>
                      <Select value={formData.metric} onValueChange={(value) => {
                        const metric = metricOptions.find(m => m.value === value);
                        setFormData({...formData, metric: value, unit: metric?.unit || '%'});
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          {metricOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe what this KPI measures"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="target">Target Value</Label>
                      <Input
                        id="target"
                        type="number"
                        value={formData.target}
                        onChange={(e) => setFormData({...formData, target: e.target.value})}
                        placeholder="90"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="warning">Warning Threshold</Label>
                      <Input
                        id="warning"
                        type="number"
                        value={formData.warningThreshold}
                        onChange={(e) => setFormData({...formData, warningThreshold: e.target.value})}
                        placeholder="70"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="critical">Critical Threshold</Label>
                      <Input
                        id="critical"
                        type="number"
                        value={formData.criticalThreshold}
                        onChange={(e) => setFormData({...formData, criticalThreshold: e.target.value})}
                        placeholder="50"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department (Optional)</Label>
                      <Select value={formData.departmentId} onValueChange={(value) => setFormData({...formData, departmentId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="All departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All departments</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="alerts"
                        checked={formData.alertsEnabled}
                        onCheckedChange={(checked) => setFormData({...formData, alertsEnabled: checked})}
                      />
                      <Label htmlFor="alerts">Enable Alerts</Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      {editingKPI ? 'Update KPI' : 'Create KPI'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing KPIs</h3>
            {filteredKPIs.map(kpi => (
              <Card key={kpi.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{kpi.name}</h4>
                      <p className="text-sm text-gray-600">{kpi.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Target: {kpi.target}{kpi.unit}</span>
                        <span>Warning: {kpi.threshold.warning}{kpi.unit}</span>
                        <span>Critical: {kpi.threshold.critical}{kpi.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(kpi)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(kpi.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <Card key={alert.id} className={`${alert.acknowledged ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {alert.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-gray-500">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alerts</h3>
                  <p className="text-gray-600">All KPIs are performing within expected ranges</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KPIManagement;