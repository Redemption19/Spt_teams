"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash2, Check, X, Calendar } from "lucide-react"
import { format } from "date-fns"

import { LeaveRequest, LeaveService } from "@/lib/leave-service"
import { DataTable, createSortableHeader, createActionDropdown, createStatusBadge, createSelectColumn } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RESPONSIVE_PATTERNS } from "@/lib/responsive-utils"
import { cn } from "@/lib/utils"

interface LeavesDataTableProps {
  workspaceId?: string
  workspaceIds?: string[]
  shouldShowCrossWorkspace?: boolean
  onLeaveClick?: (leave: LeaveRequest) => void
  onLeaveApprove?: (leave: LeaveRequest) => void
  onLeaveReject?: (leave: LeaveRequest) => void
}

const statusMap = {
  pending: { label: "Pending", variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  approved: { label: "Approved", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  rejected: { label: "Rejected", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return format(start, "MMM dd, yyyy")
  }
  
  if (format(start, "yyyy") === format(end, "yyyy")) {
    return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`
  }
  
  return `${format(start, "MMM dd, yyyy")} - ${format(end, "MMM dd, yyyy")}`
}

function getDaysText(days: number): string {
  return days === 1 ? "1 day" : `${days} days`
}

export function LeavesDataTable({
  workspaceId,
  workspaceIds,
  shouldShowCrossWorkspace = false,
  onLeaveClick,
  onLeaveApprove,
  onLeaveReject,
}: LeavesDataTableProps) {
  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<LeaveRequest>[] = React.useMemo(
    () => [
      createSelectColumn<LeaveRequest>(),
      {
        accessorKey: "employeeName",
        header: createSortableHeader("Employee"),
        cell: ({ row }) => {
          const leave = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">{leave.employeeName}</span>
              <span className="text-sm text-muted-foreground">
                {leave.employeeEmail}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "leaveType",
        header: createSortableHeader("Leave Type"),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.leaveType}
          </Badge>
        ),
      },
      {
        accessorKey: "startDate",
        header: createSortableHeader("Period"),
        cell: ({ row }) => {
          const leave = row.original
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {formatDateRange(leave.startDate, leave.endDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                {getDaysText(leave.days)}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "days",
        header: createSortableHeader("Days"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">
              {row.original.days}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: createSortableHeader("Status"),
        cell: ({ row }) => {
          const leave = row.original
          const status = row.original.status
          const statusConfig = statusMap[status] || { label: status, variant: "secondary" }
          return (
            <div className="flex flex-col gap-1">
              <Badge 
                variant={statusConfig.variant as any} 
                className={cn("capitalize", statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>
              {leave.emergency && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                  Emergency
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "appliedDate",
        header: createSortableHeader("Applied Date"),
        cell: ({ row }) => {
          const appliedDate = row.original.appliedDate
          return (
            <span className="text-sm">
              {format(new Date(appliedDate), "MMM dd, yyyy")}
            </span>
          )
        },
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate text-sm" title={row.original.reason}>
            {row.original.reason}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const leave = row.original
          const actions = [
            {
              label: "View Details",
              onClick: (leave: LeaveRequest) => onLeaveClick?.(leave),
              icon: Eye,
            },
          ]

          // Add approve/reject actions only for pending requests
          if (leave.status === "pending") {
            actions.push(
              {
                label: "Approve",
                onClick: (leave: LeaveRequest) => onLeaveApprove?.(leave),
                icon: Check,
              },
              {
                label: "Reject",
                onClick: (leave: LeaveRequest) => onLeaveReject?.(leave),
                icon: X,
              }
            )
          }

          return createActionDropdown<LeaveRequest>(actions)({ row })
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onLeaveClick, onLeaveApprove, onLeaveReject]
  )

  const fetchLeaves = React.useCallback(async () => {
    try {
      setLoading(true)
      let leavesData: LeaveRequest[] = []
      
      if (shouldShowCrossWorkspace && workspaceIds && workspaceIds.length > 0) {
        // Cross-workspace: fetch from multiple workspaces
        leavesData = await LeaveService.getMultiWorkspaceLeaveRequests(workspaceIds)
      } else if (workspaceId) {
        // Single workspace: fetch from specific workspace
        leavesData = await LeaveService.getLeaveRequests({ workspaceId })
      }
      
      setLeaves(leavesData)
    } catch (error) {
      console.error("Error fetching leaves:", error)
      toast({
        title: "Error",
        description: "Failed to fetch leave requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [workspaceId, workspaceIds, shouldShowCrossWorkspace, toast])

  React.useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

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
      <div className={RESPONSIVE_PATTERNS.tableContainer}>
        <DataTable
          columns={columns}
          data={leaves}
          searchKey="employeeName"
          searchPlaceholder="Search by employee name..."
          onRowClick={onLeaveClick}
          className={cn("w-full", RESPONSIVE_PATTERNS.tableResponsive)}
        />
      </div>
    </div>
  )
}

export default LeavesDataTable