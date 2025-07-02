'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarIcon, 
  Filter, 
  RefreshCw, 
  X,
  Users,
  Building,
  FileText,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/lib/workspace-context';
import { DepartmentService } from '@/lib/department-service';
import { ReportTemplateService } from '@/lib/report-template-service';
import { UserService } from '@/lib/user-service';
import { DashboardFilters as DashboardFiltersType, DashboardDatePreset } from '@/lib/types';

interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onFiltersChange: (filters: DashboardFiltersType) => void;
  onRefresh: () => void;
  loading: boolean;
}

const datePresets: DashboardDatePreset[] = [
  { label: 'Last 7 days', value: 'week', days: 7 },
  { label: 'Last 30 days', value: 'month', days: 30 },
  { label: 'Last 3 months', value: 'quarter', days: 90 },
  { label: 'Last year', value: 'year', days: 365 },
];

export function DashboardFilters({ 
  filters, 
  onFiltersChange, 
  onRefresh, 
  loading 
}: DashboardFiltersProps) {
  const { currentWorkspace } = useWorkspace();
  const [departments, setDepartments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!currentWorkspace?.id) return;

      try {
        setDataLoading(true);
        const [depts, tmpls, usrs] = await Promise.all([
          DepartmentService.getWorkspaceDepartments(currentWorkspace.id),
          ReportTemplateService.getWorkspaceTemplates(currentWorkspace.id),
          UserService.getUsersByWorkspace(currentWorkspace.id),
        ]);

        setDepartments(depts);
        setTemplates(tmpls);
        setUsers(usrs);
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadFilterOptions();
  }, [currentWorkspace?.id]);

  const handleDatePresetChange = (preset: string) => {
    const presetData = datePresets.find(p => p.value === preset);
    if (presetData) {
      const to = new Date();
      const from = new Date(to.getTime() - presetData.days * 24 * 60 * 60 * 1000);
      
      onFiltersChange({
        ...filters,
        dateRange: {
          from,
          to,
          preset: presetData.value,
        },
      });
    }
  };

  const handleCustomDateRange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          from: range.from,
          to: range.to,
          preset: 'custom',
        },
      });
    }
  };

  const handleFilterChange = (key: keyof DashboardFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
        preset: 'month',
      },
      department: 'all',
      status: 'all',
      template: 'all',
      user: 'all',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.department !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.template !== 'all') count++;
    if (filters.user !== 'all') count++;
    return count;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Dashboard Filters</CardTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={getActiveFilterCount() === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Date Range</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
              {datePresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={filters.dateRange.preset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatePresetChange(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            {/* Custom Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={filters.dateRange.preset === 'custom' ? "default" : "outline"}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.preset === 'custom' ? (
                    `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to, 'MMM dd')}`
                  ) : (
                    'Custom Range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from}
                  selected={{
                    from: filters.dateRange.from,
                    to: filters.dateRange.to,
                  }}
                  onSelect={handleCustomDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Department Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Department
            </Label>
            <Select
              value={filters.department}
              onValueChange={(value) => handleFilterChange('department', value)}
              disabled={dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Template
            </Label>
            <Select
              value={filters.template}
              onValueChange={(value) => handleFilterChange('template', value)}
              disabled={dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              User
            </Label>
            <Select
              value={filters.user}
              onValueChange={(value) => handleFilterChange('user', value)}
              disabled={dataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 