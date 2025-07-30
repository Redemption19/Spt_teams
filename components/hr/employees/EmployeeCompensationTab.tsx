'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X,
  Save,
  Loader2
} from 'lucide-react';

import { FormData } from './types';

interface EmployeeCompensationTabProps {
  formData: FormData;
  onInputChange: (field: keyof FormData, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  mode: 'create' | 'edit';
}

export function EmployeeCompensationTab({
  formData,
  onInputChange,
  onCancel,
  onSubmit,
  saving,
  mode
}: EmployeeCompensationTabProps) {
  return (
    <div className="space-y-6">
      {/* Base Salary */}
      <Card>
        <CardHeader>
          <CardTitle>Base Compensation</CardTitle>
          <CardDescription>Primary salary and payment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="baseSalary">Base Salary *</Label>
              <Input
                id="baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={(e) => onInputChange('baseSalary', e.target.value)}
                placeholder="50000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => onInputChange('currency', e.target.value)}
                placeholder="USD"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="payFrequency">Pay Frequency</Label>
              <Select value={formData.payFrequency} onValueChange={(value: any) => onInputChange('payFrequency', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allowances */}
      <Card>
        <CardHeader>
          <CardTitle>Allowances</CardTitle>
          <CardDescription>Additional compensation and allowances</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="housingAllowance">Housing Allowance</Label>
              <Input
                id="housingAllowance"
                type="number"
                value={formData.housingAllowance}
                onChange={(e) => onInputChange('housingAllowance', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="transportAllowance">Transport Allowance</Label>
              <Input
                id="transportAllowance"
                type="number"
                value={formData.transportAllowance}
                onChange={(e) => onInputChange('transportAllowance', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medicalAllowance">Medical Allowance</Label>
              <Input
                id="medicalAllowance"
                type="number"
                value={formData.medicalAllowance}
                onChange={(e) => onInputChange('medicalAllowance', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="otherAllowance">Other Allowance</Label>
              <Input
                id="otherAllowance"
                type="number"
                value={formData.otherAllowance}
                onChange={(e) => onInputChange('otherAllowance', e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
          <CardDescription>Employee benefits and perks</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="benefits">Benefits (comma-separated)</Label>
            <Textarea
              id="benefits"
              value={formData.benefits}
              onChange={(e) => onInputChange('benefits', e.target.value)}
              placeholder="Health Insurance, Dental Coverage, Life Insurance"
              rows={3}
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