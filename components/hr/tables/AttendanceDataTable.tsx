"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash2, Clock } from "lucide-react"
import { format } from "date-fns"

import { AttendanceRecord, AttendanceService } from "@/lib/attendance-service"
import { DataTable, createSortableHeader, createActionDropdown, createStatusBadge, createSelectColumn } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RESPONSIVE_PATTERNS } from "@/lib/responsive-utils"
import { cn } from "@/lib/utils"

interface AttendanceDataTableProps {
  workspaceId?: string
  workspaceIds?: string[]
  shouldShowCrossWorkspace?: boolean
  startDate?: Date
  endDate?: Date
  onAttendanceClick?: (attendance: AttendanceRecord) => void
  onAttendanceEdit?: (attendance: AttendanceRecord) => void
  onAttendanceDelete?: (attendance: AttendanceRecord) => void
}

const statusMap = {
  present: { label: "Present", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  absent: { label: "Absent", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  late: { label: "Late", variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  "half-day": { label: "Half Day", variant: "outline", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  "work-from-home": { label: "WFH", variant: "secondary", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
}

function formatTime(time: string | null): string {
  if (!time) return "--:--"
  return time
}

function formatWorkHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

export function AttendanceDataTable({
  workspaceId,
  workspaceIds,
  shouldShowCrossWorkspace = false,
  startDate,
  endDate,
  onAttendanceClick,
  onAttendanceEdit,
  onAttendanceDelete,
}: AttendanceDataTableProps) {
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<AttendanceRecord>[] = React.useMemo(
    () => [
      createSelectColumn<AttendanceRecord>(),
      {
        accessorKey: "employeeName",
        header: createSortableHeader("Employee"),
        cell: ({ row }) => {
          const record = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">{record.employeeName}</span>
              <span className="text-sm text-muted-foreground">
                ID: {record.employeeId}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "date",
        header: createSortableHeader("Date"),
        cell: ({ row }) => {
          const date = row.original.date
          return (
            <span className="text-sm">
              {format(new Date(date), "MMM dd, yyyy")}
            </span>
          )
        },
      },
      {
        accessorKey: "clockIn",
        header: createSortableHeader("Clock In"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-mono">
              {formatTime(row.original.clockIn)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "clockOut",
        header: createSortableHeader("Clock Out"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-mono">
              {formatTime(row.original.clockOut)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: createSortableHeader("Status"),
        cell: ({ row }) => {
          const status = row.original.status
          const statusConfig = statusMap[status] || { label: status, variant: "secondary" }
          return (
            <Badge 
              variant={statusConfig.variant as any} 
              className={cn("capitalize", statusConfig.className)}
            >
              {statusConfig.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "workHours",
        header: createSortableHeader("Hours Worked"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatWorkHours(row.original.workHours)}
            </span>
            {row.original.overtime > 0 && (
              <span className="text-xs text-orange-600">
                +{formatWorkHours(row.original.overtime)} OT
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "location",
        header: createSortableHeader("Location"),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.location}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: createActionDropdown<AttendanceRecord>([
          {
            label: "View Details",
            onClick: (record) => onAttendanceClick?.(record),
            icon: Eye,
          },
          {
            label: "Edit Record",
            onClick: (record) => onAttendanceEdit?.(record),
            icon: Edit,
          },
          {
            label: "Delete Record",
            onClick: (record) => onAttendanceDelete?.(record),
            icon: Trash2,
          },
        ]),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onAttendanceClick, onAttendanceEdit, onAttendanceDelete]
  )

  const fetchAttendance = React.useCallback(async () => {
    try {
      setLoading(true)
      
      let attendanceData: AttendanceRecord[] = []
      
      if (shouldShowCrossWorkspace && workspaceIds && Array.isArray(workspaceIds) && workspaceIds.length > 0) {
        // Cross-workspace mode: fetch data from multiple workspaces
        attendanceData = await AttendanceService.getMultiWorkspaceAttendance(
          workspaceIds,
          undefined, // date parameter
          (startDate || endDate) ? { startDate, endDate } : {} // Pass empty object to get all records
        )
      } else if (workspaceId) {
        // Single workspace mode: fetch data from current workspace
        const filters = {
          workspaceId,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        }
        attendanceData = await AttendanceService.getAttendanceRecords(filters)
      } else {
        attendanceData = []
      }
      
      setAttendance(attendanceData)
    } catch (error) {
      console.error("AttendanceDataTable - Error fetching attendance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch attendance records. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [shouldShowCrossWorkspace, workspaceIds, workspaceId, startDate, endDate, toast])

  React.useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-md">
          <div className="h-12 bg-muted animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-t bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-4", RESPONSIVE_PATTERNS.containerSmall)}>
      <div>
        <h3 className="text-base sm:text-lg font-semibold">Attendance Records</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Track employee attendance and working hours
        </p>
      </div>
      
      <div className={RESPONSIVE_PATTERNS.tableContainer}>
        <DataTable
          columns={columns}
          data={attendance}
          searchKey="employeeName"
          searchPlaceholder="Search by employee name..."
          onRowClick={onAttendanceClick}
          className={cn("w-full", RESPONSIVE_PATTERNS.tableResponsive)}
        />
      </div>
    </div>
  )
}

export default AttendanceDataTable