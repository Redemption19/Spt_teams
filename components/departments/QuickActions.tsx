'use client';

import React, { useState } from 'react';
import { Plus, FileText, Settings, Users, BarChart3, Download, Upload, RefreshCw, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function QuickActions() {
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Department performance data has been updated.",
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    toast({
      title: "Export Started",
      description: `Exporting department data as ${format.toUpperCase()}...`,
    });
    // In real app, this would trigger actual export
  };

  const handleCreateDepartment = () => {
    setIsCreateDeptOpen(false);
    toast({
      title: "Department Created",
      description: "New department has been successfully created.",
    });
  };

  const handleGenerateReport = () => {
    setIsReportOpen(false);
    toast({
      title: "Report Generated",
      description: "Performance report is being generated and will be available shortly.",
    });
  };

  const quickActions = [
    {
      label: 'Create Department',
      icon: Plus,
      action: () => setIsCreateDeptOpen(true),
      variant: 'default' as const,
      description: 'Add a new department'
    },
    {
      label: 'Generate Report',
      icon: FileText,
      action: () => setIsReportOpen(true),
      variant: 'outline' as const,
      description: 'Create performance report'
    },
    {
      label: 'Refresh Data',
      icon: RefreshCw,
      action: handleRefresh,
      variant: 'outline' as const,
      description: 'Update all metrics',
      loading: isRefreshing
    }
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Quick Action Buttons */}
      <div className="hidden sm:flex items-center gap-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.action}
              disabled={action.loading}
              className="flex items-center gap-2"
            >
              <Icon className={`h-4 w-4 ${action.loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{action.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('csv')} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Department Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Teams
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Configure KPIs
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Review
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile Quick Actions */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={index}
                  onClick={action.action}
                  disabled={action.loading}
                  className="flex items-center gap-2"
                >
                  <Icon className={`h-4 w-4 ${action.loading ? 'animate-spin' : ''}`} />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Department Dialog */}
      <Dialog open={isCreateDeptOpen} onOpenChange={setIsCreateDeptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Department
            </DialogTitle>
            <DialogDescription>
              Add a new department to your organization structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Department Name</label>
              <input
                type="text"
                placeholder="e.g., Product Development"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department Head</label>
              <input
                type="text"
                placeholder="Select department head"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget Allocation</label>
              <input
                type="number"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDeptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDepartment}>
              Create Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Performance Report
            </DialogTitle>
            <DialogDescription>
              Create a comprehensive performance report for departments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                <option>Monthly Performance Report</option>
                <option>Quarterly Review</option>
                <option>Annual Summary</option>
                <option>Custom Report</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Departments</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Marketing</option>
                <option>Sales</option>
                <option>HR</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport}>
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}