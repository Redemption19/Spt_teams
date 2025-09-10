"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-context";
import { CurrencySelector } from "@/components/financial/CurrencySelector";
import { BudgetTrackingService } from "@/lib/budget-tracking-service";
import { DepartmentService, Department } from "@/lib/department-service";
// TODO: Import ProjectService, TeamService if available
import type { BudgetFormData } from "@/lib/types/financial-types";
import { FileText, Wallet, Settings, AlertTriangle, Save, Users, ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateCategoryDialog from '@/components/financial/CreateCategoryDialog';
import { ExpenseManagementService } from '@/lib/expense-management-service';
import type { ExpenseCategory } from '@/lib/types/financial-types';
import { PermissionsService } from '@/lib/permissions-service';

interface BudgetCreateProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export default function BudgetCreate({ onSuccess, onCancel, initialData, isEdit }: BudgetCreateProps) {
  const { user, userProfile } = useAuth();
  const { currentWorkspace, accessibleWorkspaces } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  // TODO: Add projects, teams state
  const [assignmentType, setAssignmentType] = useState<'workspace'|'department'|'project'|'team'>('department');
  const [canCreate, setCanCreate] = useState(false);

  // Determine which workspaceId to use (edit: budget's workspace, create: current)
  const effectiveWorkspaceId = isEdit && initialData?.workspaceId ? initialData.workspaceId : currentWorkspace?.id;

  const [formData, setFormData] = useState<BudgetFormData>(() => {
    if (isEdit && initialData) {
      // Convert any Firestore timestamps to Date objects if needed
      return {
        ...initialData,
        startDate: initialData.startDate instanceof Date ? initialData.startDate : new Date(initialData.startDate),
        endDate: initialData.endDate instanceof Date ? initialData.endDate : new Date(initialData.endDate),
      };
    }
    return {
      name: '',
      type: 'department',
      entityId: '',
      amount: 0,
      currency: 'GHS',
      period: 'monthly',
      startDate: new Date(),
      endDate: new Date(),
      categories: [],
      alerts: [{ threshold: 80, notifyUsers: [] }],
    };
  });

  // Load departments (and projects, teams) on mount or when effectiveWorkspaceId changes
  useEffect(() => {
    const loadData = async () => {
      if (!effectiveWorkspaceId) return;
      try {
        const workspaceDepartments = await DepartmentService.getWorkspaceDepartments(effectiveWorkspaceId);
        setDepartments(workspaceDepartments);
        // Fetch categories for budgets (reuse expense categories)
        const workspaceCategories = await ExpenseManagementService.getWorkspaceExpenseCategories(effectiveWorkspaceId);
        setCategories(workspaceCategories);
        // TODO: Load projects, teams
      } catch (error) {
        setDepartments([]);
        setCategories([]);
      }
    };
    loadData();
  }, [effectiveWorkspaceId]);

  // Handle assignment type (owner can assign to workspace)
  useEffect(() => {
    if (userProfile?.role === 'owner') {
      setAssignmentType('workspace');
      setFormData((prev) => ({ ...prev, type: 'workspace', entityId: effectiveWorkspaceId || '' }));
    }
  }, [userProfile?.role, effectiveWorkspaceId]);

  useEffect(() => {
    async function checkPermission() {
      if (user && effectiveWorkspaceId) {
        if (userProfile?.role === 'owner') {
          setCanCreate(true);
        } else {
          setCanCreate(await PermissionsService.hasPermission(user.uid, effectiveWorkspaceId, 'budgets.create'));
        }
      }
    }
    checkPermission();
  }, [user, userProfile, effectiveWorkspaceId]);

  if (!canCreate) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to create budgets.</div>;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignmentChange = (type: 'workspace'|'department'|'project'|'team', entityId: string) => {
    setAssignmentType(type);
    if (type === 'workspace') {
      setFormData((prev) => ({ ...prev, type, entityId: effectiveWorkspaceId || '' }));
    } else {
      setFormData((prev) => ({ ...prev, type, entityId }));
    }
  };

  const handleAlertChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const alerts = [...prev.alerts];
      alerts[index] = { ...alerts[index], [field]: value };
      return { ...prev, alerts };
    });
  };

  const handleAddAlert = () => {
    setFormData((prev) => ({ ...prev, alerts: [...prev.alerts, { threshold: 90, notifyUsers: [] }] }));
  };

  const handleRemoveAlert = (index: number) => {
    setFormData((prev) => {
      const alerts = prev.alerts.filter((_, i) => i !== index);
      return { ...prev, alerts };
    });
  };

  const handleCategoryCreated = (newCategory: ExpenseCategory) => {
    setCategories(prev => [...prev, newCategory]);
    setFormData(prev => ({
      ...prev,
      categories: [newCategory.id]
    }));
  };

  // Helper to transform alerts to BudgetAlert[] for update
  function transformAlertsForUpdate(alerts: any[], budgetId: string): any[] {
    return alerts.map((alert, idx) => {
      const alertData: any = {
        id: alert.id || `${budgetId}_alert_${idx}`,
        budgetId,
        threshold: alert.threshold,
        type: alert.threshold >= 90 ? 'critical' : alert.threshold >= 75 ? 'warning' : 'warning',
        message: alert.message || `Budget ${alert.threshold}% utilized`,
        notifyUsers: alert.notifyUsers || [],
        triggered: alert.triggered || false,
      };
      
      // Only include triggeredAt if it has a valid value
      if (alert.triggeredAt) {
        alertData.triggeredAt = alert.triggeredAt;
      }
      
      return alertData;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !effectiveWorkspaceId) {
      toast({ title: "Error", description: "User or workspace not found", variant: "destructive" });
      return;
    }
    if (!formData.name || !formData.amount || !formData.currency || !formData.period || !formData.startDate || !formData.endDate || !formData.type || !formData.entityId) {
      toast({ title: "Error", description: `Please fill in all required fields. Assignment: ${assignmentType}, entityId: ${formData.entityId}`, variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      
      // Convert special "no selection" values back to empty strings
      const processedFormData = {
        ...formData,
        entityId: formData.entityId === 'no-workspaces' ? '' : formData.entityId
      };
      
      if (isEdit && initialData && initialData.id) {
        // Update existing budget (use correct workspaceId for update logic if needed)
        const updateData: any = {
          ...processedFormData,
          alerts: transformAlertsForUpdate(processedFormData.alerts, initialData.id),
        };
        
        // Remove undefined values to prevent Firebase errors
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });
        
        await BudgetTrackingService.updateBudget(initialData.id, updateData);
        toast({ title: "Success", description: "Budget updated successfully" });
      } else {
        // Create new budget
        await BudgetTrackingService.createBudget(effectiveWorkspaceId, processedFormData, user.uid);
        toast({ title: "Success", description: "Budget created successfully" });
        setFormData({
          name: '',
          type: userProfile?.role === 'owner' ? 'workspace' : 'department',
          entityId: userProfile?.role === 'owner' ? (effectiveWorkspaceId || '') : '',
          amount: 0,
          currency: 'GHS',
          period: 'monthly',
          startDate: new Date(),
          endDate: new Date(),
          categories: [],
          alerts: [{ threshold: 80, notifyUsers: [] }],
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast({ title: "Error", description: `Failed to ${isEdit ? 'update' : 'create'} budget. Please try again.`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Filter workspaces and departments based on user role
  const isOwner = userProfile?.role === 'owner';
  const isAdmin = userProfile?.role === 'admin';
  const adminWorkspaceId = currentWorkspace?.id;
  const filteredWorkspaces = isOwner
    ? accessibleWorkspaces
    : isAdmin && adminWorkspaceId
      ? accessibleWorkspaces.filter(ws => ws.id === adminWorkspaceId)
      : [];
  const filteredDepartments = isOwner
    ? departments
    : isAdmin && adminWorkspaceId
      ? departments.filter(dept => dept.workspaceId === adminWorkspaceId)
      : departments;

  return (
    
    
      <Card className="w-full">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Create New Budget</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Fill out the form below to create a new budget
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10">
                <TabsTrigger value="basic" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                  <FileText className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Basic Info</span>
                  <span className="sm:hidden">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="allocation" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                  <Users className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Allocation</span>
                  <span className="sm:hidden">Assign</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                  <Settings className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Settings</span>
                  <span className="sm:hidden">Config</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                  <AlertTriangle className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Alerts</span>
                  <span className="sm:hidden">Alert</span>
                </TabsTrigger>
              </TabsList>
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Budget Name *</Label>
                    <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                      <Label htmlFor="amount" className="text-xs sm:text-sm font-medium">Amount *</Label>
                      <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => handleInputChange('amount', parseFloat(e.target.value))} required className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm" />
                    </div>
                    <div>
                      <CurrencySelector value={formData.currency} onChange={val => handleInputChange('currency', val)} label="Currency" showConverter={true} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                    <div>
                      <Label htmlFor="period" className="text-xs sm:text-sm font-medium">Period *</Label>
                      <Select value={formData.period} onValueChange={val => handleInputChange('period', val)}>
                        <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Start Date *</Label>
                      <DatePicker value={formData.startDate} onChange={date => handleInputChange('startDate', date)} className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">End Date *</Label>
                      <DatePicker value={formData.endDate} onChange={date => handleInputChange('endDate', date)} className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm" />
                    </div>
                  </div>
                </div>
              </TabsContent>
              {/* Allocation Tab */}
              <TabsContent value="allocation" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Assign Budget To *</Label>
                    <Select value={assignmentType} onValueChange={val => handleAssignmentChange(val as any, '')}>
                      <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {isOwner && <SelectItem value="workspace">Workspace</SelectItem>}
                        <SelectItem value="department">Department</SelectItem>
                        {/* TODO: Add Project, Team options */}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Workspace selector for cross-workspace assignment (owner only) */}
                  {assignmentType === 'workspace' && isOwner && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Workspace *</Label>
                      <Select value={formData.entityId} onValueChange={val => handleInputChange('entityId', val)}>
                        <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue placeholder="Select workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredWorkspaces && filteredWorkspaces.length > 0 ? (
                            filteredWorkspaces.map(ws => (
                              <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-workspaces" disabled>No workspaces available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {assignmentType === 'department' && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium">Department *</Label>
                      <Select value={formData.entityId} onValueChange={val => handleInputChange('entityId', val)}>
                        <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDepartments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* TODO: Add Project, Team assignment fields */}
                  {assignmentType === 'workspace' && (
                    <div className="pt-2 text-xs sm:text-sm text-muted-foreground">This budget will be assigned to the entire workspace.</div>
                  )}
                </div>
              </TabsContent>
              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Describe the purpose or details of this budget..."
                      rows={3}
                      className="mt-1 sm:mt-1.5 resize-none text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <Label htmlFor="categories" className="text-xs sm:text-sm font-medium">Category</Label>
                      <CreateCategoryDialog
                        onCategoryCreated={handleCategoryCreated}
                        trigger={
                          <Button variant="ghost" size="sm" type="button" className="h-6 sm:h-7 px-2 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">New</span>
                            <span className="sm:hidden">+</span>
                          </Button>
                        }
                      />
                    </div>
                    <Select
                      value={formData.categories && formData.categories[0] ? formData.categories[0] : ''}
                      onValueChange={val => setFormData(prev => ({ ...prev, categories: [val] }))}
                    >
                      <SelectTrigger className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No categories found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Categories (comma separated)</Label>
                    <Input value={formData.categories?.join(', ') || ''} onChange={e => handleInputChange('categories', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="e.g. Marketing, IT, HR" className="mt-1 sm:mt-1.5 h-9 sm:h-10 text-xs sm:text-sm" />
                  </div>
                </div>
              </TabsContent>
              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <div className="space-y-3 sm:space-y-4">
                  {formData.alerts.map((alert, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 border rounded-lg">
                      <div className="w-full sm:w-auto">
                        <Label className="text-xs sm:text-sm font-medium">Threshold (%)</Label>
                        <Input type="number" min={1} max={100} value={alert.threshold} onChange={e => handleAlertChange(idx, 'threshold', parseInt(e.target.value))} className="mt-1 sm:mt-1.5 w-full sm:w-24 h-9 sm:h-10 text-xs sm:text-sm" />
                      </div>
                      <div className="flex-1 w-full sm:w-auto">
                        <Label className="text-xs sm:text-sm font-medium">Notify Users (comma separated emails)</Label>
                        <Input value={alert.notifyUsers.join(', ')} onChange={e => handleAlertChange(idx, 'notifyUsers', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} className="mt-1 sm:mt-1.5 w-full sm:w-64 h-9 sm:h-10 text-xs sm:text-sm" />
                      </div>
                      <Button type="button" variant="ghost" onClick={() => handleRemoveAlert(idx)} disabled={formData.alerts.length === 1} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm mt-2 sm:mt-6">
                        <span className="sm:hidden">Remove Alert</span>
                        <span className="hidden sm:inline">Remove</span>
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddAlert} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                    <Plus className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                    Add Alert
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            {/* Action Buttons - Always visible */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:flex-1 h-10 sm:h-12 text-xs sm:text-sm">
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading} className="w-full sm:flex-1 h-10 sm:h-12 text-xs sm:text-sm">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 sm:h-4 w-3 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="sm:hidden">{isEdit ? 'Updating...' : 'Creating...'}</span>
                    <span className="hidden sm:inline">{isEdit ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                    <span className="sm:hidden">{isEdit ? 'Update' : 'Create'}</span>
                    <span className="hidden sm:inline">{isEdit ? 'Update Budget' : 'Create Budget'}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
}
