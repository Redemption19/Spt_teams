'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { CalendarEvent, CalendarFilters } from '@/lib/calendar-service';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarFilters as FilterComponent } from './calendar-filters';

interface EventDialogsProps {
  // Dialog states
  isCreateEventOpen: boolean;
  setIsCreateEventOpen: (open: boolean) => void;
  isEditEventOpen: boolean;
  setIsEditEventOpen: (open: boolean) => void;
  isViewEventOpen: boolean;
  setIsViewEventOpen: (open: boolean) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  
  // Data
  selectedEvent: CalendarEvent | null;
  filters: CalendarFilters;
  setFilters: (filters: CalendarFilters) => void;
  users: any[];
  teams: any[];
  departments: any[];
  
  // Actions
  onCreateEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  
  // Permissions
  canEditEvents: boolean;
  permissions: any;
}

export function EventDialogs({
  isCreateEventOpen,
  setIsCreateEventOpen,
  isEditEventOpen,
  setIsEditEventOpen,
  isViewEventOpen,
  setIsViewEventOpen,
  isFiltersOpen,
  setIsFiltersOpen,
  selectedEvent,
  filters,
  setFilters,
  users,
  teams,
  departments,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onEditEvent,
  canEditEvents,
  permissions
}: EventDialogsProps) {
  
  // Form handling removed - now handled by dedicated pages

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (window.confirm('Are you sure you want to delete this event?')) {
      await onDeleteEvent(selectedEvent.id);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'deadline': return '⏰';
      case 'training': return '📚';
      case 'review': return '📋';
      case 'reminder': return '🔔';
      case 'report': return '📊';
      default: return '📅';
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'completed') return 'bg-green-100 text-green-700 border-green-200';
    
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'deadline': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'training': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'review': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'reminder': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'report': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* Create Event Dialog - Now handled by CreateEventPage component */}
      {/* Create functionality moved to dedicated page for better UX */}

      {/* Edit Event Dialog - Now handled by EditEventPage component */}
      {/* Edit functionality moved to dedicated page for better UX */}

      {/* View Event Dialog */}
      <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl" style={{ backgroundColor: '#1e1e1e' }}>
          <DialogHeader className="relative pb-6">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsViewEventOpen(false)}
              className="absolute right-0 top-0 h-8 w-8 rounded-full bg-white/60 hover:bg-white/80 dark:bg-gray-800/60 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-white/30 shadow-lg"
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between pr-12">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-lg">
                      {selectedEvent && getEventTypeIcon(selectedEvent.type)}
                    </div>
              </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                      {selectedEvent?.title}
                    </h1>
                    <div className="flex items-center space-x-3">
                {selectedEvent && (
                        <>
                          <Badge className={`${getEventColor(selectedEvent.type, selectedEvent.status)} border-0 font-medium px-3 py-1 text-xs`}>
                    {selectedEvent.type}
                  </Badge>
                          <Badge className={cn("border-0 font-medium px-3 py-1 text-xs", {
                            "bg-red-100 text-red-700": selectedEvent.status === 'cancelled',
                            "bg-green-100 text-green-700": selectedEvent.status === 'completed',
                            "bg-yellow-100 text-yellow-700": selectedEvent.status === 'pending',
                            "bg-blue-100 text-blue-700": selectedEvent.status === 'scheduled'
                          })}>
                            {selectedEvent.status}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description Card */}
              {selectedEvent.description && (
                  <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm">📝</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Description</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

                {/* Date & Time Card */}
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Date & Time</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {format(selectedEvent.start, "EEEE, MMMM do, yyyy")}
                        </p>
                      {!selectedEvent.allDay && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end || selectedEvent.start, "h:mm a")}
                          </p>
                        )}
                        {selectedEvent.allDay && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">All day event</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Card */}
                {selectedEvent.location && (
                  <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Location</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{selectedEvent.location}</p>
                  </div>
                )}

                {/* Notes Card */}
                {selectedEvent.notes && (
                  <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm">📄</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notes</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedEvent.notes}</p>
                </div>
                )}
              </div>

              {/* Sidebar - Right Column */}
              <div className="space-y-6">
                {/* Priority Card */}
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-lg", {
                      "bg-gradient-to-br from-red-500 to-red-600": selectedEvent.priority === 'urgent',
                      "bg-gradient-to-br from-orange-500 to-orange-600": selectedEvent.priority === 'high',
                      "bg-gradient-to-br from-yellow-500 to-yellow-600": selectedEvent.priority === 'medium',
                      "bg-gradient-to-br from-green-500 to-green-600": selectedEvent.priority === 'low'
                    })}>
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Priority</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={cn("border-0 font-medium px-3 py-2 text-sm", {
                      "bg-red-100 text-red-700": selectedEvent.priority === 'urgent',
                      "bg-orange-100 text-orange-700": selectedEvent.priority === 'high',
                      "bg-yellow-100 text-yellow-700": selectedEvent.priority === 'medium',
                      "bg-green-100 text-green-700": selectedEvent.priority === 'low'
                    })}>
                      {selectedEvent.priority.charAt(0).toUpperCase() + selectedEvent.priority.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Attendees Card */}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Attendees</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-indigo-100 text-indigo-700 border-0 font-medium px-3 py-2">
                        {selectedEvent.attendees.length} people invited
                      </Badge>
                </div>
            </div>
          )}

                {/* Actions Card */}
                <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/30 dark:border-gray-700/30 shadow-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>
                  <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setIsViewEventOpen(false)}
                      className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
                      <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            {canEditEvents && selectedEvent && (
              <>
                <Button
                  onClick={() => onEditEvent(selectedEvent)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                          className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                          Delete Event
                </Button>
              </>
            )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters Drawer */}
      <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DrawerContent className="max-h-[85vh] max-w-lg mx-auto">
          <DrawerHeader className="px-6 py-4">
            <DrawerTitle className="text-lg font-semibold">Calendar Filters</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <FilterComponent
              filters={filters}
              setFilters={setFilters}
              teams={teams}
              departments={departments}
              onClose={() => setIsFiltersOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
} 