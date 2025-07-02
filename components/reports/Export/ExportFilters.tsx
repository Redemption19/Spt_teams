import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Calendar, Users, Building2, FileText } from 'lucide-react';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

interface ReportExportFilters {
  status: 'all' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'archived';
  department: string;
  template: string;
  user: string;
  dateRange: {
    from: Date | null;
    to: Date | null;
    preset: 'week' | 'month' | 'quarter' | 'year' | 'custom' | null;
  };
  search: string;
}

interface ExportFiltersProps {
  filters: ReportExportFilters;
  onFiltersChange: (filters: Partial<ReportExportFilters>) => void;
  templates: any[];
  departments: any[];
  users: any[];
  loading: boolean;
}

export function ExportFilters({
  filters,
  onFiltersChange,
  templates,
  departments,
  users,
  loading,
}: ExportFiltersProps) {
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'dateRange') {
      return value.from || value.to || (value.preset && value.preset !== 'month');
    }
    if (key === 'search') {
      return value.length > 0;
    }
    return value !== 'all';
  });

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      department: 'all',
      template: 'all',
      user: 'all',
      dateRange: {
        from: null,
        to: null,
        preset: 'month'
      },
      search: ''
    });
  };

  const handleDatePresetChange = (preset: string) => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (preset) {
      case 'week':
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        to = now;
        break;
      case 'month':
        from = new Date(now);
        from.setMonth(now.getMonth() - 1);
        to = now;
        break;
      case 'quarter':
        from = new Date(now);
        from.setMonth(now.getMonth() - 3);
        to = now;
        break;
      case 'year':
        from = new Date(now);
        from.setFullYear(now.getFullYear() - 1);
        to = now;
        break;
      case 'custom':
        // Keep existing dates
        from = filters.dateRange.from;
        to = filters.dateRange.to;
        break;
    }

    onFiltersChange({
      dateRange: {
        from,
        to,
        preset: preset as any
      }
    });
  };

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Clear */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by report title or content..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 h-11 sm:h-10 border-border/50 focus:border-primary"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-11 sm:h-10 px-4 whitespace-nowrap"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Status
            </label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value as any })}>
              <SelectTrigger className="h-10 w-full">
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

          {/* Department Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Department
            </label>
            <Select value={filters.department} onValueChange={(value) => onFiltersChange({ department: value })}>
              <SelectTrigger className="h-10 w-full">
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

          {/* Template Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Template
            </label>
            <Select value={filters.template} onValueChange={(value) => onFiltersChange({ template: value })}>
              <SelectTrigger className="h-10 w-full">
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
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Author
            </label>
            <Select value={filters.user} onValueChange={(value) => onFiltersChange({ user: value })}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </label>
            <Select value={filters.dateRange.preset || 'custom'} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange.preset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">From Date</label>
              <EnhancedDatePicker
                date={filters.dateRange.from}
                onDateChange={(date) => onFiltersChange({
                  dateRange: { ...filters.dateRange, from: date }
                })}
                placeholder="Select start date..."
                className="h-10"
                showQuickSelection={true}
                allowClear={true}
                compact={true}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">To Date</label>
              <EnhancedDatePicker
                date={filters.dateRange.to}
                onDateChange={(date) => onFiltersChange({
                  dateRange: { ...filters.dateRange, to: date }
                })}
                placeholder="Select end date..."
                className="h-10"
                showQuickSelection={true}
                allowClear={true}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border/30">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Active filters:</span>
              {filters.status !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                  Status: {filters.status.replace('_', ' ')}
                </span>
              )}
              {filters.department !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Department: {departments.find(d => d.id === filters.department)?.name || 'Unknown'}
                </span>
              )}
              {filters.template !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Template: {templates.find(t => t.id === filters.template)?.name || 'Unknown'}
                </span>
              )}
              {filters.user !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Author: {users.find(u => u.id === filters.user)?.name || 'Unknown'}
                </span>
              )}
              {(filters.dateRange.from || filters.dateRange.to || filters.dateRange.preset !== 'month') && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Date: {filters.dateRange.preset || 'Custom range'}
                </span>
              )}
              {filters.search && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Search: "{filters.search}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter Description */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            📊 Export Filtering
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Use these filters to narrow down which reports will be included in your export. 
            All filters work together - only reports matching ALL selected criteria will be exported.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 