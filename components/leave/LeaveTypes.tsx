'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Calendar,
  Building,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveService, LeaveType, CreateLeaveTypeData } from '@/lib/leave-service';

interface LeaveTypesProps {
  workspaceId?: string;
  workspaceFilter?: 'current' | 'all';
  allWorkspaces?: any[];
  shouldShowCrossWorkspace?: boolean;
}

export default function LeaveTypes({
  workspaceId,
  workspaceFilter = 'current',
  allWorkspaces = [],
  shouldShowCrossWorkspace = false
}: LeaveTypesProps) {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [deletingType, setDeletingType] = useState<LeaveType | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDays: 25,
    carryForward: false,
    carryForwardLimit: 0,
    requiresApproval: true,
    color: 'bg-blue-100 text-blue-800'
  });

  const colorOptions = [
    { value: 'bg-blue-100 text-blue-800', label: 'Blue', preview: 'bg-blue-100 text-blue-800' },
    { value: 'bg-green-100 text-green-800', label: 'Green', preview: 'bg-green-100 text-green-800' },
    { value: 'bg-red-100 text-red-800', label: 'Red', preview: 'bg-red-100 text-red-800' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow', preview: 'bg-yellow-100 text-yellow-800' },
    { value: 'bg-purple-100 text-purple-800', label: 'Purple', preview: 'bg-purple-100 text-purple-800' },
    { value: 'bg-pink-100 text-pink-800', label: 'Pink', preview: 'bg-pink-100 text-pink-800' },
    { value: 'bg-orange-100 text-orange-800', label: 'Orange', preview: 'bg-orange-100 text-orange-800' },
    { value: 'bg-gray-100 text-gray-800', label: 'Gray', preview: 'bg-gray-100 text-gray-800' }
  ];

  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    console.log('🔍 Loading leave types for workspace:', workspaceId);
    console.log('🔍 shouldShowCrossWorkspace:', shouldShowCrossWorkspace);
    console.log('🔍 workspaceFilter:', workspaceFilter);

    try {
      setLoading(true);
      
      let types: LeaveType[] = [];

      if (shouldShowCrossWorkspace && workspaceFilter === 'all') {
        // Load from all workspaces
        const workspaceIds = allWorkspaces.map(ws => ws.id);
        console.log('🔍 Loading from all workspaces:', workspaceIds);
        types = await LeaveService.getMultiWorkspaceLeaveTypes(workspaceIds);
      } else {
        // Load from current workspace
        console.log('🔍 Loading from current workspace:', workspaceId);
        types = await LeaveService.getLeaveTypes(workspaceId);
      }

      console.log('📋 Found leave types:', types.length, types);
      setLeaveTypes(types);
    } catch (error) {
      console.error('Error loading leave types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave types. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, workspaceFilter, shouldShowCrossWorkspace, allWorkspaces, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxDays: 25,
      carryForward: false,
      carryForwardLimit: 0,
      requiresApproval: true,
      color: 'bg-blue-100 text-blue-800'
    });
    setEditingType(null);
  };

  const handleCreateType = async () => {
    if (!workspaceId || !formData.name || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const createData: CreateLeaveTypeData = {
        workspaceId,
        name: formData.name,
        description: formData.description,
        maxDays: formData.maxDays,
        carryForward: formData.carryForward,
        carryForwardLimit: formData.carryForwardLimit,
        requiresApproval: formData.requiresApproval,
        color: formData.color
      };

      await LeaveService.createLeaveType(createData);
      
      toast({
        title: 'Success',
        description: 'Leave type created successfully.',
      });

      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating leave type:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create leave type. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateType = async () => {
    if (!editingType || !formData.name || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        maxDays: formData.maxDays,
        carryForward: formData.carryForward,
        carryForwardLimit: formData.carryForwardLimit,
        requiresApproval: formData.requiresApproval,
        color: formData.color
      };

      await LeaveService.updateLeaveType(editingType.id, updateData);
      
      toast({
        title: 'Success',
        description: 'Leave type updated successfully.',
      });

      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating leave type:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update leave type. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteType = async () => {
    if (!deletingType) return;

    try {
      await LeaveService.deleteLeaveType(deletingType.id);
      
      toast({
        title: 'Success',
        description: 'Leave type deleted successfully.',
      });

      setDeletingType(null);
      loadData();
    } catch (error) {
      console.error('Error deleting leave type:', error);
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete leave type. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (type: LeaveType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description,
      maxDays: type.maxDays,
      carryForward: type.carryForward,
      carryForwardLimit: type.carryForwardLimit,
      requiresApproval: type.requiresApproval,
      color: type.color
    });
    setShowCreateDialog(true);
  };

  const handleInitializeDefaultTypes = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      await LeaveService.initializeDefaultLeaveTypes(workspaceId);
      toast({
        title: 'Success',
        description: 'Default leave types initialized successfully.',
        variant: 'default'
      });
      loadData();
    } catch (error) {
      console.error('Error initializing default leave types:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize default leave types. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateExistingTypes = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      await LeaveService.activateAllLeaveTypes(workspaceId);
      toast({
        title: 'Success',
        description: 'Existing leave types activated successfully.',
        variant: 'default'
      });
      loadData();
    } catch (error) {
      console.error('Error activating leave types:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate leave types. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = leaveTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="card-enhanced">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 w-[100px] bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-enhanced">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Leave Types</h2>
          <p className="text-muted-foreground">
            Configure available leave types and policies
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Leave Type' : 'Create Leave Type'}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'Update the leave type configuration.'
                  : 'Add a new leave type with its policies and settings.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Annual Leave"
                  className="border-border/50 focus:border-primary"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this leave type"
                  className="border-border/50 focus:border-primary"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxDays">Maximum Days *</Label>
                <Input
                  id="maxDays"
                  type="number"
                  min="1"
                  value={formData.maxDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDays: parseInt(e.target.value) || 0 }))}
                  className="border-border/50 focus:border-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger className="border-border/50 focus:border-primary">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.preview}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="carryForward"
                  checked={formData.carryForward}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, carryForward: checked as boolean }))}
                />
                <Label htmlFor="carryForward">Allow carry forward to next year</Label>
              </div>

              {formData.carryForward && (
                <div className="grid gap-2">
                  <Label htmlFor="carryForwardLimit">Carry Forward Limit</Label>
                  <Input
                    id="carryForwardLimit"
                    type="number"
                    min="0"
                    value={formData.carryForwardLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, carryForwardLimit: parseInt(e.target.value) || 0 }))}
                    className="border-border/50 focus:border-primary"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked as boolean }))}
                />
                <Label htmlFor="requiresApproval">Requires manager approval</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="border-border/50 hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingType ? handleUpdateType : handleCreateType}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search leave types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border/50 focus:border-primary"
                />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-border/50 hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTypes.length} leave type{filteredTypes.length !== 1 ? 's' : ''} found
        </p>
        {shouldShowCrossWorkspace && (
          <Badge variant="outline" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            Cross-Workspace View
          </Badge>
        )}
      </div>

      {/* Leave Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTypes.length > 0 ? (
          filteredTypes.map((type) => (
            <Card key={type.id} className="card-enhanced">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                  </div>
                  <Badge className={type.color}>{type.maxDays} days</Badge>
                </div>
                {type.workspaceId && shouldShowCrossWorkspace && (
                  <CardDescription className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {allWorkspaces.find(ws => ws.id === type.workspaceId)?.name || 'Unknown Workspace'}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Maximum Days:</span>
                    <span className="font-medium">{type.maxDays}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Carry Forward:</span>
                    <div className="flex items-center gap-1">
                      {type.carryForward ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>{type.carryForward ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  
                  {type.carryForward && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Carry Forward Limit:</span>
                      <span className="font-medium">{type.carryForwardLimit} days</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Requires Approval:</span>
                    <div className="flex items-center gap-1">
                      {type.requiresApproval ? (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <span>{type.requiresApproval ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openEditDialog(type)}
                    className="flex-1 border-border/50 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDeletingType(type)}
                    className="border-border/50 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-enhanced md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Leave Types Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'No leave types have been configured yet.'
                }
              </p>
              <div className="flex gap-3 justify-center">
                {searchTerm ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Leave Type
                    </Button>
                    <Button 
                      onClick={handleInitializeDefaultTypes}
                      disabled={loading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Initialize Default Types
                    </Button>
                    <Button 
                      onClick={handleActivateExistingTypes}
                      disabled={loading}
                      variant="outline"
                      className="border-border/50 hover:bg-accent hover:text-accent-foreground"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Activate Existing Types
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
        <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl break-words">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
              Delete Leave Type
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete "<span className="font-medium break-words">{deletingType?.name}</span>"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deletingType && (
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-medium text-sm">Leave Type:</span>
                <span className="text-sm break-words">{deletingType.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-medium text-sm">Maximum Days:</span>
                <span className="text-sm">{deletingType.maxDays} days</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-medium text-sm">Carry Forward:</span>
                <span className="text-sm">{deletingType.carryForward ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeletingType(null)}
              className="w-full sm:w-auto h-11 sm:h-10 border-border/50 hover:bg-accent hover:text-accent-foreground touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteType}
              className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
            >
              <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Delete Leave Type</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}