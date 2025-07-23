"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Expense } from "@/lib/types/financial-types"
import { formatNumber, formatDate } from "@/lib/utils"

export interface ExpenseTableData extends Expense {
  workspaceName?: string
  departmentName?: string
  submittedByName?: string
  canEdit?: boolean
  canDelete?: boolean
}

interface ExpenseColumnsProps {
  showAllWorkspaces?: boolean
  getCurrencyCode: () => string
  onEdit: (expense: ExpenseTableData) => void
  onDelete: (expense: ExpenseTableData) => void
  onView: (expense: ExpenseTableData) => void
}

export const createExpenseColumns = ({
  showAllWorkspaces = false,
  getCurrencyCode,
  onEdit,
  onDelete,
  onView
}: ExpenseColumnsProps): ColumnDef<ExpenseTableData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const expense = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{expense.title}</div>
          {expense.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {expense.description}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const expense = row.original
      return (
        <div className="text-right">
          <div className="font-medium">
            {expense.currency} {formatNumber(expense.amount)}
          </div>
          {expense.currency !== getCurrencyCode() && expense.amountInBaseCurrency && (
            <div className="text-xs text-muted-foreground">
              ≈ {getCurrencyCode()} {formatNumber(expense.amountInBaseCurrency)}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const expense = row.original
      return (
        <div>
          <div className="font-medium">{expense.category.name}</div>
          {expense.subcategory && (
            <div className="text-xs text-muted-foreground">{expense.subcategory}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("departmentName") || "No Department"}</div>
    ),
  },
  ...(showAllWorkspaces ? [{
    accessorKey: "workspaceName",
    header: "Workspace",
    cell: ({ row }: { row: any }) => (
      <div className="text-sm font-medium">{row.getValue("workspaceName") || "Unknown"}</div>
    ),
  }] : []),
  {
    accessorKey: "expenseDate",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium">{formatDate(row.getValue("expenseDate"))}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'approved': return 'bg-green-100 text-green-800 border-green-200'
          case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
          case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
          case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
          default: return 'bg-blue-100 text-blue-800 border-blue-200'
        }
      }
      
      return (
        <Badge className={getStatusColor(status)} variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "submittedByName",
    header: "Submitted By",
    cell: ({ row }) => (
      <div className="text-sm font-medium">{row.getValue("submittedByName") || "Unknown"}</div>
    ),
  },
  {
    id: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const expense = row.original
      if (!expense.tags || expense.tags.length === 0) return null
      
      return (
        <div className="flex flex-wrap gap-1 max-w-32">
          {expense.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {expense.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{expense.tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const expense = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(expense)}>
              View Details
            </DropdownMenuItem>
            {expense.canEdit && (
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                Edit Expense
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {expense.canDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(expense)}
                className="text-destructive focus:text-destructive"
              >
                Delete Expense
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
