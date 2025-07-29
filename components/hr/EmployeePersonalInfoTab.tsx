'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building,
  X,
  Save,
  Loader2
} from 'lucide-react';

import { FormData } from './types';

interface EmployeePersonalInfoTabProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  isOwner: boolean;
  mode: 'create' | 'edit';
  availableWorkspaces: any[];
}

export function EmployeePersonalInfoTab({
  formData,
  onInputChange,
  onWorkspaceChange,
  onCancel,
  onSubmit,
  saving,
  isOwner,
  mode,
  availableWorkspaces
}: EmployeePersonalInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Workspace Selection (for owners) */}
      {isOwner && mode === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Workspace Selection
            </CardTitle>
            <CardDescription>Select the workspace where this employee will be assigned</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="workspaceId">Workspace *</Label>
              <Select value={formData.workspaceId} onValueChange={onWorkspaceChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {availableWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => onInputChange('firstName', e.target.value)}
                placeholder="John"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => onInputChange('lastName', e.target.value)}
                placeholder="Doe"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  placeholder="john.doe@company.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => onInputChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(value: any) => onInputChange('gender', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Information
          </CardTitle>
          <CardDescription>Residential address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => onInputChange('street', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => onInputChange('city', e.target.value)}
                placeholder="New York"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => onInputChange('state', e.target.value)}
                placeholder="NY"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => onInputChange('zipCode', e.target.value)}
                placeholder="10001"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => onInputChange('country', e.target.value)}
                placeholder="United States"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>Contact information for emergencies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
                placeholder="Jane Doe"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactRelationship">Relationship</Label>
              <Input
                id="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) => onInputChange('emergencyContactRelationship', e.target.value)}
                placeholder="Spouse"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={(e) => onInputChange('emergencyContactPhone', e.target.value)}
              placeholder="+1234567890"
              className="mt-1"
            />
          </div>
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