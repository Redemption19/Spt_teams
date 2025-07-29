"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Budget } from "@/lib/types/financial-types";
import { formatNumber, formatDate } from "@/lib/utils";

export interface BudgetTableData extends Budget {
  canEdit?: boolean;
  canDelete?: boolean;
}

interface BudgetColumnsProps {
  onEdit: (budget: BudgetTableData) => void;
  onDelete: (budget: BudgetTableData) => void;
  onView: (budget: BudgetTableData) => void;
  getDepartmentName: (id: string) => string;
}

export const createBudgetColumns = ({
  onEdit,
  onDelete,
  onView,
  getDepartmentName
}: BudgetColumnsProps): ColumnDef<BudgetTableData>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const budget = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{budget.name}</div>
          {budget.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {budget.description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const budget = row.original;
      return (
        <div className="text-right font-medium">
          {budget.currency} {formatNumber(budget.amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "period",
    header: "Period",
    cell: ({ row }) => {
      const budget = row.original;
      return <div className="font-medium capitalize">{budget.period}</div>;
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const budget = row.original;
      return <div className="font-medium">{formatDate(budget.startDate)}</div>;
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      const budget = row.original;
      return <div className="font-medium">{formatDate(budget.endDate)}</div>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const budget = row.original;
      const status = budget.isActive ? (budget.endDate && new Date(budget.endDate) < new Date() ? 'completed' : 'active') : 'draft';
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'active': return 'bg-green-100 text-green-800 border-green-200';
          case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
      };
      return (
        <Badge className={getStatusColor(status)} variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => {
      const budget = row.original;
      return budget.type === 'department' ? (
        <div className="font-medium">{getDepartmentName(budget.entityId)}</div>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const budget = row.original;
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
            <DropdownMenuItem onClick={() => onView(budget)}>
              View Details
            </DropdownMenuItem>
            {budget.canEdit && (
              <DropdownMenuItem onClick={() => onEdit(budget)}>
                Edit Budget
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {budget.canDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(budget)}
                className="text-destructive focus:text-destructive"
              >
                Delete Budget
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 