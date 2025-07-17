'use client';

import { useEffect, useRef, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarEvent } from '@/lib/calendar-service';

interface CalendarViewProps {
  events: CalendarEvent[];
  view: 'month' | 'week' | 'day';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop?: (eventId: string, updates: Partial<CalendarEvent>) => void;
  canCreateEvents?: boolean;
}

export interface CalendarViewRef {
  gotoToday: () => void;
  gotoDate: (date: Date) => void;
}

export const CalendarView = forwardRef<CalendarViewRef, CalendarViewProps>(({
  events,
  view,
  currentDate,
  onDateChange,
  onEventClick,
  onEventDrop,
  canCreateEvents = false
}, ref) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    gotoToday: () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        const today = new Date();
        console.log('CalendarView.gotoToday called, navigating to:', today);
        calendarApi.gotoDate(today);
      }
    },
    gotoDate: (date: Date) => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        console.log('CalendarView.gotoDate called, navigating to:', date);
        calendarApi.gotoDate(date);
      }
    }
  }), []);

  // Memoize the fullCalendarEvents to prevent recreation on every render
  const fullCalendarEvents = useMemo(() => 
    events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay || false,
    backgroundColor: getEventColor(event.type, event.status),
    borderColor: getEventBorderColor(event.priority),
    textColor: getEventTextColor(event.type),
    extendedProps: {
      ...event,
      description: event.description,
      location: event.location,
      attendees: event.attendees,
      notes: event.notes,
    }
    })), [events]);

  // Map view names to FullCalendar views
  const getCalendarView = useCallback(() => {
    switch (view) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      default:
        return 'dayGridMonth';
    }
  }, [view]);

  const currentDateTime = currentDate.getTime();

  // Update calendar when date changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const calendarCurrentDate = calendarApi.getDate();
      
      console.log('Calendar date change - Current:', currentDate, 'Calendar internal:', calendarCurrentDate);
      
      // Only navigate if the dates are significantly different (more than a day apart)
      if (Math.abs(calendarCurrentDate.getTime() - currentDateTime) > 24 * 60 * 60 * 1000) {
        console.log('Navigating calendar to:', currentDate);
      calendarApi.gotoDate(currentDate);
    }
    }
  }, [currentDateTime, currentDate]);

  // Initialize calendar to current date on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        console.log('Initializing calendar to date:', currentDate);
        calendarApi.gotoDate(currentDate);
      }
    }, 100); // Small delay to ensure calendar is fully initialized
    
    return () => clearTimeout(timer);
  }, [currentDate]);

  // Update calendar when view changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(getCalendarView());
    }
  }, [view, getCalendarView]);

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      onEventClick(event);
    }
  };

  const handleEventDrop = (dropInfo: any) => {
    if (!onEventDrop) return;

    const eventId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    onEventDrop(eventId, {
      start: newStart,
      end: newEnd
    });
  };

  const handleDateSelect = (selectInfo: any) => {
    if (!canCreateEvents) return;
    
    // This could trigger a create event dialog with pre-filled dates
    console.log('Date selected:', selectInfo.start, selectInfo.end);
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={getCalendarView()}
        events={fullCalendarEvents}
        
        // Header configuration
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        
        // Customize button text
        buttonText={{
          today: 'Today'
        }}
        
        // Event handling
        eventClick={handleEventClick}
        eventDrop={canCreateEvents ? handleEventDrop : undefined}
        selectable={canCreateEvents}
        select={handleDateSelect}
        editable={canCreateEvents}
        droppable={canCreateEvents}
        
        // Date navigation - let parent handle date changes manually
        // datesSet callback removed to prevent conflicts
        
        // Appearance
        height="auto"
        aspectRatio={1.35}
        nowIndicator={true}
        weekNumbers={false}
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkClick="popover"
        
        // Responsive behavior
        handleWindowResize={true}
        
        // Time configuration
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        
        // Week configuration
        firstDay={1} // Monday
        weekends={true}
        
        // Event content customization
        eventContent={(eventInfo) => (
          <div className="fc-event-content-custom">
            <div className="fc-event-title-custom">
              {getEventIcon(eventInfo.event.extendedProps.type)}
              <span className="ml-1">{eventInfo.event.title}</span>
            </div>
            {eventInfo.event.extendedProps.location && (
              <div className="fc-event-location text-xs opacity-75">
                📍 {eventInfo.event.extendedProps.location}
              </div>
            )}
          </div>
        )}
        
        // Styling
        themeSystem="standard"
        
        // Event limit for month view
        dayMaxEventRows={3}
        
        // Custom CSS classes
        eventClassNames={(eventInfo) => [
          'custom-event',
          `event-type-${eventInfo.event.extendedProps.type}`,
          `event-priority-${eventInfo.event.extendedProps.priority}`,
          `event-status-${eventInfo.event.extendedProps.status}`
        ]}
      />
      
      <style jsx global>{`
        .fc {
          background: transparent;
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border: 1px solid hsl(var(--border));
        }
        
        .fc-theme-standard td, 
        .fc-theme-standard th {
          border: 1px solid hsl(var(--border));
        }
        
        .fc-col-header-cell {
          background: hsl(var(--muted));
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
        }
        
        .fc-daygrid-day-number,
        .fc-timegrid-slot-label {
          color: hsl(var(--foreground));
          font-weight: 500;
        }
        
        .fc-day-today {
          background: hsl(var(--accent) / 0.1) !important;
        }
        
        .fc-event {
          border-radius: 6px;
          border: none !important;
          font-size: 0.75rem;
          padding: 2px 6px;
          margin: 1px 0;
        }
        
        .fc-event-title-custom {
          display: flex;
          align-items: center;
          font-weight: 500;
        }
        
        .fc-event-location {
          margin-top: 2px;
        }
        
        .fc-button {
          background: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .fc-button:hover {
          background: hsl(var(--primary) / 0.9) !important;
          border-color: hsl(var(--primary) / 0.9) !important;
        }
        
        .fc-button:disabled {
          background: hsl(var(--muted)) !important;
          border-color: hsl(var(--muted)) !important;
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .fc-today-button {
          background: hsl(var(--accent)) !important;
          border-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        .fc-prev-button,
        .fc-next-button {
          background: hsl(var(--secondary)) !important;
          border-color: hsl(var(--secondary)) !important;
          color: hsl(var(--secondary-foreground)) !important;
        }
        
        .fc-toolbar-title {
          color: hsl(var(--foreground));
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .fc-more-link {
          color: hsl(var(--primary));
          font-weight: 500;
        }
        
        .fc-popover {
          background: hsl(var(--popover));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        
        .fc-popover-header {
          background: hsl(var(--muted));
          border-bottom: 1px solid hsl(var(--border));
          padding: 8px 12px;
          font-weight: 600;
        }
        
        .fc-list-table {
          border: none;
        }
        
        .fc-list-day-cushion {
          background: hsl(var(--muted) / 0.5);
          font-weight: 600;
        }
        
        .fc-list-event {
          cursor: pointer;
        }
        
        .fc-list-event:hover {
          background: hsl(var(--accent) / 0.1);
        }
      `}</style>
    </div>
  );
});

CalendarView.displayName = 'CalendarView';

// Helper functions for event styling
function getEventColor(type: string, status: string): string {
  if (status === 'cancelled') return '#ef4444'; // red-500
  if (status === 'completed') return '#22c55e'; // green-500
  
  switch (type) {
    case 'meeting':
      return '#3b82f6'; // blue-500
    case 'deadline':
      return '#f59e0b'; // amber-500
    case 'training':
      return '#10b981'; // emerald-500
    case 'review':
      return '#8b5cf6'; // violet-500
    case 'reminder':
      return '#6b7280'; // gray-500
    case 'report':
      return '#ec4899'; // pink-500
    default:
      return '#6b7280'; // gray-500
  }
}

function getEventBorderColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#dc2626'; // red-600
    case 'high':
      return '#ea580c'; // orange-600
    case 'medium':
      return '#ca8a04'; // yellow-600
    case 'low':
      return '#16a34a'; // green-600
    default:
      return '#6b7280'; // gray-500
  }
}

function getEventTextColor(type: string): string {
  return '#ffffff'; // Always white for better contrast
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'meeting':
      return '👥';
    case 'deadline':
      return '⏰';
    case 'training':
      return '📚';
    case 'review':
      return '📋';
    case 'reminder':
      return '🔔';
    case 'report':
      return '📊';
    default:
      return '📅';
  }
} 