'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/lib/workspace-context';
import { useAuth } from '@/lib/auth-context';
import { DepartmentService, type Department } from '@/lib/department-service';
import { UserService } from '@/lib/user-service';
import { type User } from '@/lib/types';

interface DepartmentFormData {
  name: string;
  headId: string;
  status: 'active' | 'inactive';
  description: string;
}

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { userProfile } = useAuth();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    headId: '',
    status: 'active',
    description: '',
  });

  const departmentId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      // Wait for workspace to load before checking
      if (workspaceLoading) {
        return;
      }
      
      if (!currentWorkspace?.id || !departmentId) {
        setError('Missing workspace or department ID');
        setLoading(false);
        setUsersLoading(false);
        return;
      }

      try {
        setLoading(true);
        setUsersLoading(true);
        
        // Fetch department and users in parallel
        const [dept, workspaceUsers] = await Promise.all([
          DepartmentService.getDepartment(currentWorkspace.id, departmentId),
          UserService.getUsersByWorkspace(currentWorkspace.id)
        ]);
        
        setDepartment(dept);
        setUsers(workspaceUsers);
        
        if (dept) {
          setFormData({
            name: dept.name,
            headId: dept.headId || 'none',
            status: dept.status === 'active' ? 'active' : 'inactive',
            description: dept.description || '',
          });
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load department details');
        toast({
          title: 'Error',
          description: 'Failed to load department details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        setUsersLoading(false);
      }
    };

    fetchData();
  }, [currentWorkspace?.id, departmentId, workspaceLoading, toast]);

  const handleInputChange = (field: keyof DepartmentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace?.id || !userProfile?.id || !department) {
      toast({
        title: 'Error',
        description: 'Missing required information for update.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Department name is required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await DepartmentService.updateDepartment(
          currentWorkspace.id,
          departmentId,
          {
            name: formData.name.trim(),
            headId: formData.headId === 'none' ? undefined : formData.headId,
            status: formData.status,
            description: formData.description.trim(),
          },
          userProfile.id
        );

      toast({
        title: 'Success',
        description: 'Department updated successfully.',
      });

      router.push(`/dashboard/departments/${departmentId}`);
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update department. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/departments/${departmentId}`);
  };

  if (loading || workspaceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading department details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push(`/dashboard/departments/${departmentId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Department
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Error Loading Department</h3>
            <p className="text-muted-foreground mb-4">{error || 'Department not found'}</p>
            <Button onClick={() => router.push('/dashboard/departments')}>
              Back to Departments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Edit Department
          </h1>
          <p className="text-muted-foreground">
            Update department information
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>
            Update the details for {department.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter department name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="headId">Department Head</Label>
                <Select
                  value={formData.headId}
                  onValueChange={(value) => handleInputChange('headId', value)}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Loading users..." : "Select department head (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department head</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => 
                  handleInputChange('status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter department description (optional)"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}