'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X,
  Save,
  Loader2
} from 'lucide-react';

import { FormData } from './types';

interface EmployeeEmploymentTabProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string) => void;
  onDepartmentChange: (departmentName: string) => void;
  onManagerChange: (managerName: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  mode: 'create' | 'edit';
  departments: any[];
  managers: any[];
}

export function EmployeeEmploymentTab({
  formData,
  onInputChange,
  onDepartmentChange,
  onManagerChange,
  onCancel,
  onSubmit,
  saving,
  mode,
  departments,
  managers
}: EmployeeEmploymentTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
          <CardDescription>Role, department, and employment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Job Title/Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => onInputChange('role', e.target.value)}
                placeholder="Software Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={onDepartmentChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept._workspaceName ? `${dept.name} (${dept._workspaceName})` : dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manager">Manager</Label>
              <Select value={formData.manager} onValueChange={onManagerChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.name}>
                      {manager._workspaceName ? `${manager.name} (${manager._workspaceName})` : manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => onInputChange('hireDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select value={formData.employmentType} onValueChange={(value: any) => onInputChange('employmentType', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workLocation">Work Location</Label>
              <Select value={formData.workLocation} onValueChange={(value: any) => onInputChange('workLocation', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.employmentType === 'contract' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="probationEndDate">Probation End Date</Label>
                <Input
                  id="probationEndDate"
                  type="date"
                  value={formData.probationEndDate}
                  onChange={(e) => onInputChange('probationEndDate', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contractEndDate">Contract End Date</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => onInputChange('contractEndDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          {mode === 'create' ? 'Create Employee' : 'Update Employee'}
        </Button>
      </div>
    </div>
  );
} 