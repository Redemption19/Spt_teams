"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, UserX, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

import { Employee, EmployeeService } from "@/lib/employee-service"
import { DataTable, createSortableHeader, createActionDropdown, createStatusBadge, createSelectColumn } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RESPONSIVE_PATTERNS } from "@/lib/responsive-utils"
import { cn } from "@/lib/utils"

interface EmployeesDataTableProps {
  workspaceId?: string
  workspaceIds?: string[]
  shouldShowCrossWorkspace?: boolean
  onEmployeeClick?: (employee: Employee) => void
  onEmployeeEdit?: (employee: Employee) => void
  onEmployeeDeactivate?: (employee: Employee) => void
}

const statusMap = {
  active: { label: "Active", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  "on-leave": { label: "On Leave", variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  suspended: { label: "Suspended", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  resigned: { label: "Resigned", variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  terminated: { label: "Terminated", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
}

export function EmployeesDataTable({
  workspaceId,
  workspaceIds,
  shouldShowCrossWorkspace = false,
  onEmployeeClick,
  onEmployeeEdit,
  onEmployeeDeactivate,
}: EmployeesDataTableProps) {
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<Employee>[] = React.useMemo(
    () => [
      createSelectColumn<Employee>(),
      {
        accessorKey: "personalInfo.firstName",
        header: createSortableHeader("Name"),
        cell: ({ row }) => {
          const employee = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
              </span>
              <span className="text-sm text-muted-foreground">
                ID: {employee.employeeId}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "personalInfo.email",
        header: createSortableHeader("Email"),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.personalInfo.email}</span>
        ),
      },
      {
        accessorKey: "employmentDetails.department",
        header: createSortableHeader("Department"),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.employmentDetails.department}
          </Badge>
        ),
      },
      {
        accessorKey: "employmentDetails.role",
        header: createSortableHeader("Position"),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.employmentDetails.role}</span>
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
        accessorKey: "employmentDetails.hireDate",
        header: createSortableHeader("Hire Date"),
        cell: ({ row }) => {
          const hireDate = row.original.employmentDetails.hireDate
          return (
            <span className="text-sm">
              {format(new Date(hireDate), "MMM dd, yyyy")}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: createActionDropdown<Employee>([
          {
            label: "View Details",
            onClick: (employee) => onEmployeeClick?.(employee),
            icon: Eye,
          },
          {
            label: "Edit Employee",
            onClick: (employee) => onEmployeeEdit?.(employee),
            icon: Edit,
          },
          {
            label: "Deactivate",
            onClick: (employee) => onEmployeeDeactivate?.(employee),
            icon: UserX,
          },
        ]),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEmployeeClick, onEmployeeEdit, onEmployeeDeactivate]
  )

  const fetchEmployees = React.useCallback(async () => {
    try {
      setLoading(true)
      let employeesData: Employee[] = []
      
      if (shouldShowCrossWorkspace && workspaceIds && workspaceIds.length > 0) {
        // Cross-workspace: fetch from multiple workspaces
        employeesData = await EmployeeService.getAccessibleEmployees(workspaceIds)
      } else if (workspaceId) {
        // Single workspace: fetch from specific workspace
        employeesData = await EmployeeService.getWorkspaceEmployees(workspaceId)
      }
      
      setEmployees(employeesData)
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [workspaceId, workspaceIds, shouldShowCrossWorkspace, toast]);

  React.useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  if (loading) {
    return (
      <div className="space-y-6">
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
          data={employees}
          searchKey="personalInfo.firstName"
          searchPlaceholder="Search employees..."
          onRowClick={onEmployeeClick}
          className={cn("w-full", RESPONSIVE_PATTERNS.tableResponsive)}
        />
      </div>
    </div>
  )
}

export default EmployeesDataTable