"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  label?: string
  placeholder?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

export function DatePicker({
  label,
  placeholder = "Select date",
  value,
  onChange,
  className,
  required = false,
  disabled = false,
  id
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <Label htmlFor={id} className="px-1 text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
              "border border-input bg-background",
              "transition-colors duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {value ? format(value, "PPP") : placeholder}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto overflow-hidden p-0 shadow-lg border" 
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            className="bg-background"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-foreground",
              caption_dropdowns: "flex justify-center gap-1",
              vhidden: "hidden",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 text-muted-foreground hover:text-foreground",
                "hover:bg-primary/10 hover:text-primary",
                "focus:bg-primary/10 focus:text-primary",
                "transition-colors duration-200 rounded-md"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal rounded-md",
                "hover:bg-primary/10 hover:text-primary",
                "focus:bg-primary/10 focus:text-primary",
                "transition-colors duration-200",
                "aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected: cn(
                "bg-primary text-primary-foreground",
                "hover:bg-primary hover:text-primary-foreground",
                "focus:bg-primary focus:text-primary-foreground",
                "font-medium"
              ),
              day_today: cn(
                "bg-accent text-accent-foreground",
                "font-medium"
              ),
              day_outside: cn(
                "day-outside text-muted-foreground opacity-50",
                "aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30"
              ),
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
              dropdown: cn(
                "absolute z-10 w-auto bg-background border border-input rounded-md shadow-lg",
                "max-h-60 overflow-auto"
              ),
              dropdown_month: "text-sm p-2 hover:bg-primary/10 hover:text-primary cursor-pointer",
              dropdown_year: "text-sm p-2 hover:bg-primary/10 hover:text-primary cursor-pointer",
            }}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
