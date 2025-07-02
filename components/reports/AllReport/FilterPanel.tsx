import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { FilterState, StatusFilter } from './all-reports';
import { ReportTemplate, User } from '@/lib/types';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  templates: ReportTemplate[];
  users: User[];
  departments: any[];
  resultsCount: number;
}

export function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  templates,
  users,
  departments,
  resultsCount,
}: FilterPanelProps) {
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all'
  );

  // Convert string dates to Date objects for the enhanced date picker
  const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
  const toDate = filters.dateTo ? new Date(filters.dateTo) : undefined;

  // Handle date changes from the enhanced date picker
  const handleFromDateChange = (date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    onFilterChange({ dateFrom: dateString });
  };

  const handleToDateChange = (date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    onFilterChange({ dateTo: dateString });
  };

  return (
    <Card className="border border-border/50">
      <CardContent className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Search and Quick Stats - Mobile-First Layout */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative w-full sm:flex-1 sm:max-w-md lg:max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by report title or author name..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-10 h-11 sm:h-10 border-border/50 focus:border-primary touch-manipulation"
            />
          </div>
          
          {/* Results and Clear Filters */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{resultsCount} result{resultsCount !== 1 ? 's' : ''}</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-8 sm:h-9 text-xs sm:text-sm touch-manipulation"
              >
                <X className="h-3 w-3 mr-1 flex-shrink-0" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Grid - Enhanced Mobile Layout */}
        <div className="space-y-4 sm:space-y-0">
          {/* Mobile: Stack filters vertically, Tablet+: Grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Status
              </label>
              <Select value={filters.status} onValueChange={(value: StatusFilter) => onFilterChange({ status: value })}>
                <SelectTrigger className="h-11 sm:h-9 w-full touch-manipulation">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
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
              <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Department
              </label>
              <Select value={filters.department} onValueChange={(value) => onFilterChange({ department: value })}>
                <SelectTrigger className="h-11 sm:h-9 w-full touch-manipulation">
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
              <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Template
              </label>
              <Select value={filters.template} onValueChange={(value) => onFilterChange({ template: value })}>
                <SelectTrigger className="h-11 sm:h-9 w-full touch-manipulation">
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

            {/* Submitted By Filter */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                Submitted By
              </label>
              <Select value={filters.submittedBy} onValueChange={(value) => onFilterChange({ submittedBy: value })}>
                <SelectTrigger className="h-11 sm:h-9 w-full touch-manipulation">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || `${user.firstName} ${user.lastName}` || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Date From */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                From Date
              </label>
              <EnhancedDatePicker
                date={fromDate}
                onDateChange={handleFromDateChange}
                placeholder="Select start date..."
                className="h-11 sm:h-9"
                showQuickSelection={true}
                allowClear={true}
              />
            </div>

            {/* Enhanced Date To */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
                To Date
              </label>
              <EnhancedDatePicker
                date={toDate}
                onDateChange={handleToDateChange}
                placeholder="Select end date..."
                className="h-11 sm:h-9"
                showQuickSelection={true}
                allowClear={true}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary - Mobile-Friendly */}
        {hasActiveFilters && (
          <div className="pt-2 sm:pt-3 border-t border-border/30">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Active filters:</span>
              {filters.status !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Status: {filters.status.replace('_', ' ')}
                </span>
              )}
              {filters.department !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Department: {departments.find(d => d.id === filters.department)?.name}
                </span>
              )}
              {filters.template !== 'all' && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Template: {templates.find(t => t.id === filters.template)?.name}
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Date range
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}