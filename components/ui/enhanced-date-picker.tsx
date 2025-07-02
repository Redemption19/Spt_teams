'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface EnhancedDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showQuickSelection?: boolean;
  allowClear?: boolean;
  compact?: boolean;
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  showQuickSelection = true,
  allowClear = true,
  compact = false,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const quickSelections = [
    { label: 'Today', getValue: () => new Date() },
    { label: 'Yesterday', getValue: () => new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: 'Last 7 days', getValue: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    { label: 'Last 30 days', getValue: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { label: 'This month', getValue: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
  ];

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange?.(undefined);
  };

  const handleQuickSelect = (getValue: () => Date) => {
    onDateChange?.(getValue());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal transition-all duration-200",
            compact ? "h-9 text-sm" : "h-11",
            "hover:border-primary/30 hover:bg-primary/5",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className={cn("mr-2 opacity-70", compact ? "h-3 w-3" : "h-4 w-4")} />
          <span className="flex-1 truncate">
            {date ? format(date, "dd/MM/yyyy") : placeholder}
          </span>
          {date && allowClear && (
            <X 
              className={cn("opacity-70 hover:opacity-100 transition-opacity", compact ? "h-3 w-3" : "h-4 w-4")}
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0 bg-background border border-border shadow-xl rounded-lg",
          compact ? "text-sm" : ""
        )}
        align="start"
        sideOffset={4}
      >
        {showQuickSelection && (
          <div className={cn("border-b border-border/50", compact ? "p-2" : "p-3")}>
            <h4 className={cn("font-medium text-foreground mb-2", compact ? "text-xs" : "text-sm")}>
              Quick Selection
            </h4>
            <div className={cn("flex flex-wrap", compact ? "gap-1" : "gap-2")}>
              {quickSelections.map((option) => (
                <Badge
                  key={option.label}
                  variant="secondary"
                  className={cn(
                    "cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors",
                    compact ? "text-xs px-2 py-0.5 h-6" : "text-xs px-2 py-1"
                  )}
                  onClick={() => handleQuickSelect(option.getValue)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate);
            setOpen(false);
          }}
          initialFocus
          className={cn(
            "rounded-none border-0 shadow-none",
            compact ? "p-2" : "p-3"
          )}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: compact ? "space-y-2" : "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: compact ? "text-sm font-medium" : "text-base font-semibold",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-primary/10 transition-all duration-200",
              compact && "h-5 w-5"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: compact ? "flex mb-1" : "flex mb-2",
            head_cell: cn(
              "text-muted-foreground rounded-md font-medium text-center",
              compact ? "w-8 h-6 text-xs" : "w-9 h-8 text-xs"
            ),
            row: "flex w-full mt-1",
            cell: cn(
              "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              compact ? "h-8 w-8" : "h-9 w-9"
            ),
            day: cn(
              "font-normal aria-selected:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:text-primary rounded-md",
              compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
            ),
            day_selected: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 shadow-sm",
            day_today: "bg-accent/20 text-accent-foreground font-medium border border-accent/30",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
            day_hidden: "invisible",
          }}
        />
        
        {date && (
          <div className={cn("border-t border-border/50 bg-muted/20", compact ? "p-2" : "p-3")}>
            <div className={cn("flex items-center justify-between", compact ? "text-xs" : "text-sm")}>
              <span className="text-muted-foreground">Selected:</span>
              <span className="font-medium text-foreground">
                {format(date, compact ? "dd/MM/yyyy" : "EEEE, MMMM do, yyyy")}
              </span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 