"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Pause, Play, X, Users } from "lucide-react"
import { format } from "date-fns"

import { JobPosting, RecruitmentService } from "@/lib/recruitment-service"
import { DataTable, createSortableHeader, createActionDropdown, createStatusBadge, createSelectColumn } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { RESPONSIVE_PATTERNS } from "@/lib/responsive-utils"
import { cn } from "@/lib/utils"

interface RecruitmentDataTableProps {
  workspaceId?: string
  workspaceIds?: string[]
  shouldShowCrossWorkspace?: boolean
  onJobClick?: (job: JobPosting) => void
  onJobEdit?: (job: JobPosting) => void
  onJobPause?: (job: JobPosting) => void
  onJobResume?: (job: JobPosting) => void
  onJobClose?: (job: JobPosting) => void
}

const statusMap = {
  draft: { label: "Draft", variant: "outline", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  published: { label: "Published", variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  active: { label: "Active", variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  paused: { label: "Paused", variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  closed: { label: "Closed", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
}

const typeMap = {
  "full-time": { label: "Full-time", className: "bg-blue-50 text-blue-700" },
  "part-time": { label: "Part-time", className: "bg-green-50 text-green-700" },
  contract: { label: "Contract", className: "bg-purple-50 text-purple-700" },
  intern: { label: "Intern", className: "bg-orange-50 text-orange-700" },
}

const levelMap = {
  entry: { label: "Entry", className: "bg-gray-50 text-gray-700" },
  mid: { label: "Mid", className: "bg-blue-50 text-blue-700" },
  senior: { label: "Senior", className: "bg-green-50 text-green-700" },
  executive: { label: "Executive", className: "bg-purple-50 text-purple-700" },
}

function formatSalaryRange(salaryRange: JobPosting['salaryRange']): string {
  const { min, max, currency } = salaryRange
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  
  if (min === max) {
    return formatter.format(min)
  }
  
  return `${formatter.format(min)} - ${formatter.format(max)}`
}

export function RecruitmentDataTable({
  workspaceId,
  workspaceIds,
  shouldShowCrossWorkspace = false,
  onJobClick,
  onJobEdit,
  onJobPause,
  onJobResume,
  onJobClose,
}: RecruitmentDataTableProps) {
  const [jobs, setJobs] = React.useState<JobPosting[]>([])
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()

  const columns: ColumnDef<JobPosting>[] = React.useMemo(
    () => [
      createSelectColumn<JobPosting>(),
      {
        accessorKey: "title",
        header: createSortableHeader("Job Title"),
        cell: ({ row }) => {
          const job = row.original
          return (
            <div className="flex flex-col">
              <span className="font-medium">{job.title}</span>
              <div className="flex gap-1 mt-1">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", typeMap[job.type]?.className)}
                >
                  {typeMap[job.type]?.label || job.type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", levelMap[job.level]?.className)}
                >
                  {levelMap[job.level]?.label || job.level}
                </Badge>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "department",
        header: createSortableHeader("Department"),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.department}
          </Badge>
        ),
      },
      {
        accessorKey: "applications",
        header: createSortableHeader("Applications"),
        cell: ({ row }) => {
          const applicationsCount = row.original.applications?.length || 0
          return (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">
                {applicationsCount}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "location",
        header: createSortableHeader("Location"),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.location}</span>
        ),
      },
      {
        accessorKey: "salaryRange",
        header: createSortableHeader("Salary Range"),
        cell: ({ row }) => (
          <span className="text-sm font-mono">
            {formatSalaryRange(row.original.salaryRange)}
          </span>
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
        accessorKey: "publishedAt",
        header: createSortableHeader("Posted Date"),
        cell: ({ row }) => {
          const publishedAt = row.original.publishedAt || row.original.postedDate
          if (!publishedAt) {
            return <span className="text-sm text-muted-foreground">Not published</span>
          }
          return (
            <span className="text-sm">
              {format(new Date(publishedAt), "MMM dd, yyyy")}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const job = row.original
          const actions = [
            {
              label: "View Details",
              onClick: (job: JobPosting) => onJobClick?.(job),
              icon: Eye,
            },
            {
              label: "Edit Job",
              onClick: (job: JobPosting) => onJobEdit?.(job),
              icon: Edit,
            },
          ]

          // Add status-specific actions
          if (job.status === "active" || job.status === "published") {
            actions.push({
              label: "Pause Job",
              onClick: (job: JobPosting) => onJobPause?.(job),
              icon: Pause,
            })
          }

          if (job.status === "paused") {
            actions.push({
              label: "Resume Job",
              onClick: (job: JobPosting) => onJobResume?.(job),
              icon: Play,
            })
          }

          if (job.status !== "closed") {
            actions.push({
              label: "Close Job",
              onClick: (job: JobPosting) => onJobClose?.(job),
              icon: X,
            })
          }

          return createActionDropdown<JobPosting>(actions)({ row })
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onJobClick, onJobEdit, onJobPause, onJobResume, onJobClose]
  )

  const fetchJobs = React.useCallback(async () => {
    try {
      setLoading(true)
      
      let jobsData: JobPosting[] = []
      
      if (shouldShowCrossWorkspace && workspaceIds && workspaceIds.length > 0) {
        // Fetch from multiple workspaces
        jobsData = await RecruitmentService.getMultiWorkspaceJobPostings(workspaceIds)
      } else if (workspaceId) {
        // Fetch from single workspace
        jobsData = await RecruitmentService.getJobPostings(workspaceId)
      }
      
      setJobs(jobsData)
    } catch (error) {
      console.error("Error fetching jobs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch job postings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [workspaceId, workspaceIds, shouldShowCrossWorkspace, toast])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

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
          data={jobs}
          searchKey="title"
          searchPlaceholder="Search job titles..."
          onRowClick={onJobClick}
          className={cn("w-full", RESPONSIVE_PATTERNS.tableResponsive)}
        />
      </div>
    </div>
  )
}

export default RecruitmentDataTable