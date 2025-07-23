'use client';

import { Project, Task, User, Team, ActivityLog } from './types';
import { format as formatDate } from 'date-fns';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'summary';
export type ExportType = 'projects' | 'tasks' | 'users' | 'teams' | 'activities' | 'reports' | 'expenses';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  data: any[];
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

export class ExportService {
  /**
   * Main export function
   */
  static async exportData(options: ExportOptions): Promise<void> {
    const { format, type, data, filename } = options;
    const defaultFilename = `${type}_export_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss')}`;
    const finalFilename = filename || defaultFilename;

    try {
      switch (format) {
        case 'csv':
          await this.exportToCSV(data, type, finalFilename);
          break;
        case 'excel':
          await this.exportToExcel(data, type, finalFilename);
          break;
        case 'pdf':
        case 'summary':
          await this.exportToPDF(data, type, finalFilename);
          break;
        case 'json':
          await this.exportToJSON(data, finalFilename);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export ${type} as ${format}`);
    }
  }

  /**
   * Export to CSV
   */
  private static async exportToCSV(data: any[], type: ExportType, filename: string): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = this.getHeaders(type);
    const rows = data.map(item => this.formatRowForCSV(item, type));

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  /**
   * Export to Excel (using CSV format for browser compatibility)
   */
  private static async exportToExcel(data: any[], type: ExportType, filename: string): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // For browser compatibility, we'll use CSV format with Excel MIME type
    // This creates an Excel-compatible CSV file that can be opened in Excel
    const headers = this.getHeaders(type);
    const rows = data.map(item => this.formatRowForCSV(item, type));

    const csvContent = [
      headers.join(','), // Use commas for proper CSV format
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF';
    // Use .csv extension with Excel MIME type for maximum compatibility
    this.downloadFile(bom + csvContent, `${filename}.csv`, 'application/vnd.ms-excel');
  }

  /**
   * Export to PDF
   */
  private static async exportToPDF(data: any[], type: ExportType, filename: string): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Create HTML content for PDF
    const htmlContent = this.generateHTMLForPDF(data, type);
    
    // For browser compatibility, we'll create a printable HTML page
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  /**
   * Export to JSON
   */
  private static async exportToJSON(data: any[], filename: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  /**
   * Get headers for different data types
   */
  private static getHeaders(type: ExportType): string[] {
    switch (type) {
      case 'projects':
        return [
          'ID', 'Name', 'Description', 'Status', 'Priority', 'Progress', 
          'Team ID', 'Owner ID', 'Start Date', 'Due Date', 'Created At', 'Updated At'
        ];
      case 'tasks':
        return [
          'ID', 'Title', 'Description', 'Project ID', 'Assignee ID', 'Assignee Name',
          'Status', 'Priority', 'Due Date', 'Estimated Hours', 'Actual Hours',
          'Tags', 'Created At', 'Updated At'
        ];
      case 'users':
        return [
          'ID', 'Name', 'Email', 'Role', 'Status', 'Job Title', 'Department',
          'Team IDs', 'Branch ID', 'Region ID', 'Created At', 'Last Active'
        ];
      case 'teams':
        return [
          'ID', 'Name', 'Description', 'Workspace ID', 'Branch ID', 'Region ID',
          'Lead ID', 'Created At', 'Updated At', 'Created By'
        ];
      case 'activities':
        return [
          'ID', 'User ID', 'Action', 'Entity', 'Entity ID', 'Workspace ID',
          'Details', 'Timestamp'
        ];
      case 'expenses':
        return [
          'ID', 'Title', 'Description', 'Amount', 'Currency', 'Amount (GHS)', 
          'Category', 'Status', 'Receipt', 'Merchant', 'Payment Method',
          'Submitted By', 'Submitted Date', 'Approved By', 'Approved Date',
          'Created At', 'Updated At'
        ];
      default:
        return ['ID', 'Data'];
    }
  }

  /**
   * Format row data for CSV export
   */
  private static formatRowForCSV(item: any, type: ExportType): string[] {
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    switch (type) {
      case 'projects':
        const project = item as Project;
        return [
          escapeCSV(project.id),
          escapeCSV(project.name),
          escapeCSV(project.description || ''),
          escapeCSV(project.status),
          escapeCSV(project.priority),
          escapeCSV(project.progress || 0),
          escapeCSV(project.teamId),
          escapeCSV(project.ownerId),
          escapeCSV(project.startDate ? formatDate(project.startDate, 'yyyy-MM-dd') : ''),
          escapeCSV(project.dueDate ? formatDate(project.dueDate, 'yyyy-MM-dd') : ''),
          escapeCSV(formatDate(project.createdAt, 'yyyy-MM-dd HH:mm:ss')),
          escapeCSV(formatDate(project.updatedAt, 'yyyy-MM-dd HH:mm:ss'))
        ];

      case 'tasks':
        const task = item as Task & { assigneeName?: string };
        return [
          escapeCSV(task.id),
          escapeCSV(task.title),
          escapeCSV(task.description || ''),
          escapeCSV(task.projectId),
          escapeCSV(task.assigneeId || ''),
          escapeCSV(task.assigneeName || ''),
          escapeCSV(task.status),
          escapeCSV(task.priority),
          escapeCSV(task.dueDate ? formatDate(task.dueDate, 'yyyy-MM-dd') : ''),
          escapeCSV(task.estimatedHours || ''),
          escapeCSV(task.actualHours || ''),
          escapeCSV(task.tags.join('; ')),
          escapeCSV(formatDate(task.createdAt, 'yyyy-MM-dd HH:mm:ss')),
          escapeCSV(formatDate(task.updatedAt, 'yyyy-MM-dd HH:mm:ss'))
        ];

      case 'users':
        const user = item as User;
        return [
          escapeCSV(user.id),
          escapeCSV(user.name),
          escapeCSV(user.email),
          escapeCSV(user.role),
          escapeCSV(user.status || ''),
          escapeCSV(user.jobTitle || ''),
          escapeCSV(user.department || ''),
          escapeCSV(user.teamIds.join('; ')),
          escapeCSV(user.branchId || ''),
          escapeCSV(user.regionId || ''),
          escapeCSV(formatDate(user.createdAt, 'yyyy-MM-dd HH:mm:ss')),
          escapeCSV(formatDate(user.lastActive, 'yyyy-MM-dd HH:mm:ss'))
        ];

      case 'teams':
        const team = item as Team;
        return [
          escapeCSV(team.id),
          escapeCSV(team.name),
          escapeCSV(team.description || ''),
          escapeCSV(team.workspaceId),
          escapeCSV(team.branchId || ''),
          escapeCSV(team.regionId || ''),
          escapeCSV(team.leadId || ''),
          escapeCSV(formatDate(team.createdAt, 'yyyy-MM-dd HH:mm:ss')),
          escapeCSV(formatDate(team.updatedAt, 'yyyy-MM-dd HH:mm:ss')),
          escapeCSV(team.createdBy)
        ];

      case 'activities':
        const activity = item as ActivityLog;
        return [
          escapeCSV(activity.id),
          escapeCSV(activity.userId),
          escapeCSV(activity.action),
          escapeCSV(activity.entity),
          escapeCSV(activity.entityId),
          escapeCSV(activity.workspaceId),
          escapeCSV(JSON.stringify(activity.details)),
          escapeCSV(formatDate(activity.timestamp, 'yyyy-MM-dd HH:mm:ss'))
        ];

      case 'expenses':
        const expense = item as any; // Using any since we need to import the expense type
        return [
          escapeCSV(expense.id),
          escapeCSV(expense.title),
          escapeCSV(expense.description || ''),
          escapeCSV(expense.amount?.toFixed(2) || ''),
          escapeCSV(expense.currency || ''),
          escapeCSV(expense.amountInBaseCurrency?.toFixed(2) || ''),
          escapeCSV(expense.category?.name || ''),
          escapeCSV(expense.status || ''),
          escapeCSV(expense.hasReceipt ? 'Yes' : 'No'),
          escapeCSV(expense.merchant || ''),
          escapeCSV(expense.paymentMethod || ''),
          escapeCSV(expense.submittedBy || ''),
          escapeCSV(expense.submittedAt ? formatDate(new Date(expense.submittedAt), 'yyyy-MM-dd HH:mm:ss') : ''),
          escapeCSV(expense.approvedBy || ''),
          escapeCSV(expense.approvedAt ? formatDate(new Date(expense.approvedAt), 'yyyy-MM-dd HH:mm:ss') : ''),
          escapeCSV(formatDate(new Date(expense.createdAt), 'yyyy-MM-dd HH:mm:ss')),
          escapeCSV(formatDate(new Date(expense.updatedAt), 'yyyy-MM-dd HH:mm:ss'))
        ];

      default:
        return [escapeCSV(item.id || ''), escapeCSV(JSON.stringify(item))];
    }
  }

  /**
   * Generate HTML content for PDF export
   */
  private static generateHTMLForPDF(data: any[], type: ExportType): string {
    const headers = this.getHeaders(type);
    const title = this.getExportTitle(type);
    
    const tableRows = data.map(item => {
      const row = this.formatRowForCSV(item, type);
      return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .export-info { margin: 20px 0; color: #666; font-size: 14px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title} Export Report</h1>
        <div class="export-info">
          <p><strong>Export Date:</strong> ${formatDate(new Date(), 'MMMM dd, yyyy HH:mm:ss')}</p>
          <p><strong>Total Records:</strong> ${data.length}</p>
          <p><strong>Export Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
        </div>
        <table>
          <thead>
            <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get export title for different types
   */
  private static getExportTitle(type: ExportType): string {
    switch (type) {
      case 'projects': return 'Projects';
      case 'tasks': return 'Tasks';
      case 'users': return 'Users';
      case 'teams': return 'Teams';
      case 'activities': return 'Activity Log';
      case 'reports': return 'Reports';
      case 'expenses': return 'Expenses';
      default: return 'Data Export';
    }
  }

  /**
   * Download file to user's device
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Export projects with enhanced data
   */
  static async exportProjectsWithStats(
    projects: any[],
    tasks: Task[],
    users: User[],
    exportFormat: ExportFormat = 'csv'
  ): Promise<void> {
    const enhancedProjects = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
      const overdueTasks = projectTasks.filter(task => 
        task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
      ).length;

      return {
        ...project,
        taskCount: projectTasks.length,
        completedTasks,
        overdueTasks,
        completionRate: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      };
    });

    await this.exportData({
      format: exportFormat,
      type: 'projects',
      data: enhancedProjects,
      filename: `projects_with_stats_${formatDate(new Date(), 'yyyy-MM-dd')}`
    });
  }

  /**
   * Export tasks with assignee names
   */
  static async exportTasksWithDetails(
    tasks: Task[],
    users: User[],
    projects: any[],
    exportFormat: ExportFormat = 'csv'
  ): Promise<void> {
    const enhancedTasks = tasks.map(task => {
      const assignee = task.assigneeId ? users.find(u => u.id === task.assigneeId) : null;
      const project = projects.find(p => p.id === task.projectId);

      return {
        ...task,
        assigneeName: assignee ? assignee.name : 'Unassigned',
        projectName: project ? project.name : 'Unknown Project',
        isOverdue: task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
      };
    });

    await this.exportData({
      format: exportFormat,
      type: 'tasks',
      data: enhancedTasks,
      filename: `tasks_detailed_${formatDate(new Date(), 'yyyy-MM-dd')}`
    });
  }

  /**
   * Export filtered data based on date range
   */
  static async exportByDateRange(
    data: any[],
    type: ExportType,
    startDate: Date,
    endDate: Date,
    exportFormat: ExportFormat = 'csv'
  ): Promise<void> {
    const filteredData = data.filter(item => {
      const itemDate = item.createdAt || item.timestamp || item.updatedAt;
      if (!itemDate) return false;
      
      const date = itemDate instanceof Date ? itemDate : new Date(itemDate);
      return date >= startDate && date <= endDate;
    });

    const dateRangeStr = `${formatDate(startDate, 'yyyy-MM-dd')}_to_${formatDate(endDate, 'yyyy-MM-dd')}`;
    
    await this.exportData({
      format: exportFormat,
      type,
      data: filteredData,
      filename: `${type}_${dateRangeStr}`,
      dateRange: { start: startDate, end: endDate }
    });
  }

  /**
   * Export summary report
   */
  static async exportSummaryReport(
    projects: any[],
    tasks: Task[],
    users: User[],
    teams: any[],
    exportFormat: ExportFormat = 'pdf'
  ): Promise<void> {
    const summary = {
      exportDate: new Date(),
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueTasks: tasks.filter(t => 
        t.dueDate && t.dueDate < new Date() && t.status !== 'completed'
      ).length,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalTeams: teams.length,
      tasksByPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length,
      },
      tasksByStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        completed: tasks.filter(t => t.status === 'completed').length,
      }
    };

    await this.exportData({
      format: exportFormat,
      type: 'reports',
      data: [summary],
      filename: `summary_report_${formatDate(new Date(), 'yyyy-MM-dd')}`
    });
  }

  /**
   * Export expenses to various formats
   */
  static async exportExpenses(
    expenses: any[], 
    format: ExportFormat = 'csv',
    filename?: string
  ): Promise<void> {
    const defaultFilename = `expenses_export_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss')}`;
    await this.exportData({
      format,
      type: 'expenses',
      data: expenses,
      filename: filename || defaultFilename
    });
  }

  /**
   * Export expense summary report
   */
  static async exportExpenseSummary(
    expenses: any[],
    analytics: any,
    format: ExportFormat = 'pdf'
  ): Promise<void> {
    const summary = {
      reportDate: new Date(),
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + (exp.amountInBaseCurrency || 0), 0),
      approvedExpenses: expenses.filter(e => e.status === 'approved').length,
      pendingExpenses: expenses.filter(e => e.status === 'submitted').length,
      rejectedExpenses: expenses.filter(e => e.status === 'rejected').length,
      approvedAmount: expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, exp) => sum + (exp.amountInBaseCurrency || 0), 0),
      pendingAmount: expenses
        .filter(e => e.status === 'submitted')
        .reduce((sum, exp) => sum + (exp.amountInBaseCurrency || 0), 0),
      categoryBreakdown: this.getCategoryBreakdown(expenses),
      topCategories: this.getTopCategories(expenses, 5),
      monthlyTrend: this.getMonthlyTrend(expenses),
      averageExpenseAmount: expenses.length > 0 
        ? expenses.reduce((sum, exp) => sum + (exp.amountInBaseCurrency || 0), 0) / expenses.length 
        : 0
    };

    if (format === 'pdf') {
      await this.exportExpenseSummaryToPDF(summary, expenses);
    } else {
      await this.exportData({
        format,
        type: 'reports',
        data: [summary],
        filename: `expense_summary_${formatDate(new Date(), 'yyyy-MM-dd')}`
      });
    }
  }

  /**
   * Export tax report for expenses
   */
  static async exportTaxReport(
    expenses: any[],
    format: ExportFormat = 'csv'
  ): Promise<void> {
    // Filter only approved expenses for tax reporting
    const taxableExpenses = expenses
      .filter(e => e.status === 'approved')
      .map(expense => ({
        id: expense.id,
        title: expense.title,
        description: expense.description,
        amount: expense.amountInBaseCurrency,
        currency: 'GHS',
        category: expense.category?.name || '',
        merchant: expense.merchant || '',
        date: expense.createdAt,
        hasReceipt: expense.hasReceipt,
        taxDeductible: expense.category?.taxDeductible || false,
        businessExpense: expense.category?.businessExpense || false
      }));

    await this.exportData({
      format,
      type: 'expenses',
      data: taxableExpenses,
      filename: `tax_report_${formatDate(new Date(), 'yyyy-MM-dd')}`
    });
  }

  /**
   * Helper method to get category breakdown
   */
  private static getCategoryBreakdown(expenses: any[]): Record<string, number> {
    return expenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + (expense.amountInBaseCurrency || 0);
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Helper method to get top categories
   */
  private static getTopCategories(expenses: any[], limit: number = 5): Array<{name: string, amount: number, count: number}> {
    const breakdown = this.getCategoryBreakdown(expenses);
    const categoryStats = Object.entries(breakdown).map(([name, amount]) => ({
      name,
      amount,
      count: expenses.filter(e => (e.category?.name || 'Uncategorized') === name).length
    }));
    
    return categoryStats
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  }

  /**
   * Helper method to get monthly trend
   */
  private static getMonthlyTrend(expenses: any[]): Array<{month: string, amount: number, count: number}> {
    const monthlyData = expenses.reduce((acc, expense) => {
      const date = new Date(expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      
      acc[monthKey].amount += expense.amountInBaseCurrency || 0;
      acc[monthKey].count += 1;
      
      return acc;
    }, {} as Record<string, {month: string, amount: number, count: number}>);

    return (Object.values(monthlyData) as Array<{month: string, amount: number, count: number}>)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  /**
   * Export expense summary to PDF with enhanced formatting
   */
  private static async exportExpenseSummaryToPDF(summary: any, expenses: any[]): Promise<void> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Summary Report</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #007bff; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          h1 { 
            color: #007bff; 
            margin: 0;
            font-size: 28px;
          }
          .report-date { 
            color: #6c757d; 
            margin-top: 10px;
            font-size: 14px;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
          }
          .summary-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #007bff;
          }
          .summary-card h3 { 
            margin: 0 0 10px 0; 
            color: #495057;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-card .value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #007bff;
          }
          .categories-section { 
            margin-top: 30px;
          }
          .section-title { 
            font-size: 20px; 
            color: #495057; 
            border-bottom: 2px solid #dee2e6; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            font-size: 14px;
          }
          th, td { 
            border: 1px solid #dee2e6; 
            padding: 12px; 
            text-align: left;
          }
          th { 
            background-color: #007bff; 
            color: white; 
            font-weight: 600;
          }
          tr:nth-child(even) { 
            background-color: #f8f9fa;
          }
          tr:hover { 
            background-color: #e3f2fd;
          }
          .amount { 
            text-align: right; 
            font-weight: 600;
          }
          .status-approved { color: #28a745; }
          .status-pending { color: #ffc107; }
          .status-rejected { color: #dc3545; }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #6c757d; 
            font-size: 12px;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
          }
          @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Expense Summary Report</h1>
            <div class="report-date">Generated on ${formatDate(summary.reportDate, 'PPP')}</div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total Expenses</h3>
              <div class="value">${summary.totalExpenses}</div>
            </div>
            <div class="summary-card">
              <h3>Total Amount</h3>
              <div class="value">GHS ${summary.totalAmount.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Approved Amount</h3>
              <div class="value status-approved">GHS ${summary.approvedAmount.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Pending Amount</h3>
              <div class="value status-pending">GHS ${summary.pendingAmount.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Average Amount</h3>
              <div class="value">GHS ${summary.averageExpenseAmount.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Approval Rate</h3>
              <div class="value">${summary.totalExpenses > 0 ? ((summary.approvedExpenses / summary.totalExpenses) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>

          <div class="categories-section">
            <h2 class="section-title">Top Categories</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${summary.topCategories.map((cat: any) => `
                  <tr>
                    <td>${cat.name}</td>
                    <td class="amount">GHS ${cat.amount.toFixed(2)}</td>
                    <td>${cat.count}</td>
                    <td>${summary.totalAmount > 0 ? ((cat.amount / summary.totalAmount) * 100).toFixed(1) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="categories-section">
            <h2 class="section-title">Status Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Amount</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="status-approved">Approved</td>
                  <td>${summary.approvedExpenses}</td>
                  <td class="amount">GHS ${summary.approvedAmount.toFixed(2)}</td>
                  <td>${summary.totalExpenses > 0 ? ((summary.approvedExpenses / summary.totalExpenses) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td class="status-pending">Pending</td>
                  <td>${summary.pendingExpenses}</td>
                  <td class="amount">GHS ${summary.pendingAmount.toFixed(2)}</td>
                  <td>${summary.totalExpenses > 0 ? ((summary.pendingExpenses / summary.totalExpenses) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td class="status-rejected">Rejected</td>
                  <td>${summary.rejectedExpenses}</td>
                  <td class="amount">GHS 0.00</td>
                  <td>${summary.totalExpenses > 0 ? ((summary.rejectedExpenses / summary.totalExpenses) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This report was generated automatically by SPT Teams Financial Management System.</p>
            <p>Report contains ${summary.totalExpenses} expenses with a total value of GHS ${summary.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and open print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
      // Don't close automatically to allow user to save as PDF
    }, 500);
  }
} 