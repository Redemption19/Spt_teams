'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Filter,
  X,
  Calendar,
  Users,
  Building,
  AlertTriangle
} from 'lucide-react';
import type { CalendarFilters } from '@/lib/calendar-service';

interface CalendarFiltersProps {
  filters: CalendarFilters;
  setFilters: (filters: CalendarFilters) => void;
  teams: any[];
  departments: any[];
  onClose: () => void;
}

export function CalendarFilters({
  filters,
  setFilters,
  teams,
  departments,
  onClose
}: CalendarFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CalendarFilters>(() => ({
    types: [],
    status: [],
    departments: [],
    teams: [],
    priority: [],
    searchTerm: '',
    dateRange: {
      start: new Date(),
      end: new Date()
    }
  }));

  // Use ref to track if we should sync filters to avoid infinite loops
  const isInitializedRef = useRef(false);

  // Sync localFilters with filters prop only on initial load or when filters actually change
  useEffect(() => {
    if (!isInitializedRef.current) {
      setLocalFilters(filters);
      isInitializedRef.current = true;
    }
  }, [filters.types.length, filters.status.length, filters.departments.length, filters.teams.length, filters.priority.length, filters.searchTerm]);

  const eventTypes = useMemo(() => [
    { value: 'meeting', label: 'Meetings', icon: '👥', color: 'bg-blue-100 text-blue-800' },
    { value: 'deadline', label: 'Deadlines', icon: '⏰', color: 'bg-amber-100 text-amber-800' },
    { value: 'training', label: 'Training', icon: '📚', color: 'bg-green-100 text-green-800' },
    { value: 'review', label: 'Reviews', icon: '📋', color: 'bg-purple-100 text-purple-800' },
    { value: 'reminder', label: 'Reminders', icon: '🔔', color: 'bg-gray-100 text-gray-800' },
    { value: 'report', label: 'Reports', icon: '📊', color: 'bg-pink-100 text-pink-800' },
  ], []);

  const eventStatuses = useMemo(() => [
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ], []);

  const priorities = useMemo(() => [
    { value: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ], []);

  const handleApplyFilters = useCallback(() => {
    setFilters(localFilters);
    onClose();
  }, [localFilters, setFilters, onClose]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: CalendarFilters = {
      types: [],
      status: [],
      departments: [],
      teams: [],
      priority: [],
      searchTerm: '',
      dateRange: {
        start: new Date(),
        end: new Date()
      }
    };
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
  }, [setFilters]);

  const handleTypeToggle = useCallback((type: string) => {
    setLocalFilters(prev => {
      const newTypes = prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type];
      
      return { ...prev, types: newTypes };
    });
  }, []);

  const handleStatusToggle = useCallback((status: string) => {
    setLocalFilters(prev => {
      const newStatus = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return { ...prev, status: newStatus };
    });
  }, []);

  const handlePriorityToggle = useCallback((priority: string) => {
    setLocalFilters(prev => {
      const newPriority = prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority];
      
      return { ...prev, priority: newPriority };
    });
  }, []);

  const handleTeamToggle = useCallback((teamId: string) => {
    setLocalFilters(prev => {
      const newTeams = prev.teams.includes(teamId)
        ? prev.teams.filter(t => t !== teamId)
        : [...prev.teams, teamId];
      
      return { ...prev, teams: newTeams };
    });
  }, []);

  const handleDepartmentToggle = useCallback((deptId: string) => {
    setLocalFilters(prev => {
      const newDepartments = prev.departments.includes(deptId)
        ? prev.departments.filter(d => d !== deptId)
        : [...prev.departments, deptId];
      
      return { ...prev, departments: newDepartments };
    });
  }, []);

  const getActiveFiltersCount = useMemo(() => {
    return localFilters.types.length + 
           localFilters.status.length + 
           localFilters.priority.length + 
           localFilters.teams.length + 
           localFilters.departments.length + 
           (localFilters.searchTerm ? 1 : 0);
  }, [localFilters]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  return (
    <div className="w-full space-y-5 px-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-base">Filters</h3>
          {getActiveFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-xs">
              {getActiveFiltersCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center">
          <Search className="h-3 w-3 mr-1" />
          Search Events
        </Label>
        <Input
          placeholder="Search events..."
          value={localFilters.searchTerm}
          onChange={handleSearchChange}
          className="h-9 text-sm"
        />
      </div>

      {/* Event Types */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Event Types
        </Label>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <Button
              key={type.value}
              variant={localFilters.types.includes(type.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeToggle(type.value)}
              className={`h-8 px-3 text-sm font-medium transition-all ${
                localFilters.types.includes(type.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <span className="mr-1.5">{type.icon}</span>
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Event Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Status
        </Label>
        <div className="flex flex-wrap gap-2">
          {eventStatuses.map((status) => (
            <Button
              key={status.value}
              variant={localFilters.status.includes(status.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusToggle(status.value)}
              className={`h-8 px-3 text-sm font-medium transition-all ${
                localFilters.status.includes(status.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Priority
        </Label>
        <div className="flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <Button
              key={priority.value}
              variant={localFilters.priority.includes(priority.value) ? "default" : "outline"}
              size="sm"
              onClick={() => handlePriorityToggle(priority.value)}
              className={`h-8 px-3 text-sm font-medium transition-all ${
                localFilters.priority.includes(priority.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                priority.value === 'urgent' ? 'bg-red-500' :
                priority.value === 'high' ? 'bg-orange-500' :
                priority.value === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              {priority.label.replace(' Priority', '')}
            </Button>
          ))}
        </div>
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground flex items-center">
            <Users className="h-3 w-3 mr-1" />
            Teams
          </Label>
          <div className="space-y-2">
            {teams.slice(0, 5).map((team) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                  localFilters.teams.includes(team.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onClick={() => handleTeamToggle(team.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    localFilters.teams.includes(team.id) ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                  <span className="font-medium">{team.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {team.memberCount || 0}
                </span>
              </div>
            ))}
            {teams.length > 5 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                +{teams.length - 5} more teams
              </div>
            )}
          </div>
        </div>
      )}

      {/* Departments */}
      {departments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground flex items-center">
            <Building className="h-3 w-3 mr-1" />
            Departments
          </Label>
          <div className="space-y-2">
            {departments.slice(0, 5).map((dept) => (
              <div
                key={dept.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                  localFilters.departments.includes(dept.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
                onClick={() => handleDepartmentToggle(dept.id)}
              >
                <div className={`w-2 h-2 rounded-full ${
                  localFilters.departments.includes(dept.id) ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
                <span className="font-medium">{dept.name}</span>
              </div>
            ))}
            {departments.length > 5 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                +{departments.length - 5} more departments
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3 pt-4 border-t">
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="flex-1 h-9 text-sm"
        >
          Clear All
        </Button>
        <Button
          onClick={handleApplyFilters}
          size="sm"
          className="flex-1 h-9 text-sm bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
} 