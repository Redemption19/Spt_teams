/**
 * Utility functions for working with invoices across workspace hierarchies
 */

import { InvoiceService } from '../invoice-service';
import { WorkspaceService } from '../workspace-service';
import { Invoice } from '../types/financial-types';
import { Workspace } from '../types';

export interface InvoiceHierarchyOptions {
  includeSubWorkspaces?: boolean;
  status?: Invoice['status'];
  clientId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface WorkspaceInvoiceSummary {
  workspaceId: string;
  workspaceName: string;
  workspaceType: 'main' | 'sub';
  invoiceCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
}

export interface HierarchyInvoiceResult {
  invoices: Invoice[];
  summary: {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    collectionRate: number;
  };
  workspaceSummaries: WorkspaceInvoiceSummary[];
  mainWorkspace: Workspace | null;
  subWorkspaces: Workspace[];
}

/**
 * Main utility function to get invoices across workspace hierarchy
 * This is the primary function you should use in your components
 */
export async function getInvoicesAcrossHierarchy(
  workspaceId: string,
  options: InvoiceHierarchyOptions = {}
): Promise<HierarchyInvoiceResult> {
  try {
    // Get workspace information
    const currentWorkspace = await WorkspaceService.getWorkspace(workspaceId);
    if (!currentWorkspace) {
      throw new Error('Workspace not found');
    }

    // Determine main workspace
    let mainWorkspaceId = workspaceId;
    if (currentWorkspace.workspaceType === 'sub' && currentWorkspace.parentWorkspaceId) {
      mainWorkspaceId = currentWorkspace.parentWorkspaceId;
    }

    const mainWorkspace = await WorkspaceService.getWorkspace(mainWorkspaceId);
    const subWorkspaces = options.includeSubWorkspaces !== false 
      ? await WorkspaceService.getSubWorkspaces(mainWorkspaceId)
      : [];

    // Get invoices using the hierarchical method
    const result = await InvoiceService.getHierarchicalInvoices(workspaceId, {
      status: options.status,
      clientId: options.clientId,
      startDate: options.startDate,
      endDate: options.endDate,
      limit: options.limit,
      includeSubWorkspaces: options.includeSubWorkspaces
    });

    // Calculate summary statistics
    const totalAmount = result.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = result.invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = result.invoices
      .filter(inv => inv.status === 'sent' || inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const now = new Date();
    const overdueAmount = result.invoices
      .filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return inv.status !== 'paid' && dueDate < now;
      })
      .reduce((sum, inv) => sum + inv.total, 0);

    const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    // Create workspace summaries
    const workspaceSummaries: WorkspaceInvoiceSummary[] = [];
    
    // Add main workspace summary
    if (mainWorkspace && result.workspaceBreakdown[mainWorkspaceId]) {
      const breakdown = result.workspaceBreakdown[mainWorkspaceId];
      const mainInvoices = result.invoices.filter(inv => inv.workspaceId === mainWorkspaceId);
      
      workspaceSummaries.push({
        workspaceId: mainWorkspaceId,
        workspaceName: breakdown.name,
        workspaceType: 'main',
        invoiceCount: breakdown.count,
        totalAmount: breakdown.total,
        paidAmount: mainInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
        pendingAmount: mainInvoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').reduce((sum, inv) => sum + inv.total, 0),
        overdueAmount: mainInvoices.filter(inv => {
          const dueDate = new Date(inv.dueDate);
          return inv.status !== 'paid' && dueDate < now;
        }).reduce((sum, inv) => sum + inv.total, 0),
        collectionRate: breakdown.total > 0 ? (mainInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) / breakdown.total) * 100 : 0
      });
    }

    // Add sub-workspace summaries
    for (const subWorkspace of subWorkspaces) {
      if (result.workspaceBreakdown[subWorkspace.id]) {
        const breakdown = result.workspaceBreakdown[subWorkspace.id];
        const subInvoices = result.invoices.filter(inv => inv.workspaceId === subWorkspace.id);
        
        workspaceSummaries.push({
          workspaceId: subWorkspace.id,
          workspaceName: breakdown.name,
          workspaceType: 'sub',
          invoiceCount: breakdown.count,
          totalAmount: breakdown.total,
          paidAmount: subInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
          pendingAmount: subInvoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').reduce((sum, inv) => sum + inv.total, 0),
          overdueAmount: subInvoices.filter(inv => {
            const dueDate = new Date(inv.dueDate);
            return inv.status !== 'paid' && dueDate < now;
          }).reduce((sum, inv) => sum + inv.total, 0),
          collectionRate: breakdown.total > 0 ? (subInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) / breakdown.total) * 100 : 0
        });
      }
    }

    return {
      invoices: result.invoices,
      summary: {
        totalInvoices: result.invoices.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        collectionRate
      },
      workspaceSummaries,
      mainWorkspace,
      subWorkspaces
    };
  } catch (error) {
    console.error('Error getting invoices across hierarchy:', error);
    throw error;
  }
}

/**
 * Get invoices for a specific workspace type (main or sub)
 */
export async function getInvoicesByWorkspaceType(
  workspaceId: string,
  workspaceType: 'main' | 'sub' | 'both' = 'both',
  options: InvoiceHierarchyOptions = {}
): Promise<Invoice[]> {
  try {
    const result = await getInvoicesAcrossHierarchy(workspaceId, options);
    
    if (workspaceType === 'both') {
      return result.invoices;
    }
    
    return result.invoices.filter(invoice => {
      const workspaceSummary = result.workspaceSummaries.find(ws => ws.workspaceId === invoice.workspaceId);
      return workspaceSummary?.workspaceType === workspaceType;
    });
  } catch (error) {
    console.error('Error getting invoices by workspace type:', error);
    throw error;
  }
}

/**
 * Get the best performing workspace in the hierarchy
 */
export async function getBestPerformingWorkspace(
  workspaceId: string,
  metric: 'revenue' | 'collection_rate' | 'invoice_count' = 'revenue'
): Promise<WorkspaceInvoiceSummary | null> {
  try {
    const result = await getInvoicesAcrossHierarchy(workspaceId);
    
    if (result.workspaceSummaries.length === 0) {
      return null;
    }
    
    return result.workspaceSummaries.reduce((best, current) => {
      switch (metric) {
        case 'revenue':
          return current.totalAmount > best.totalAmount ? current : best;
        case 'collection_rate':
          return current.collectionRate > best.collectionRate ? current : best;
        case 'invoice_count':
          return current.invoiceCount > best.invoiceCount ? current : best;
        default:
          return best;
      }
    });
  } catch (error) {
    console.error('Error getting best performing workspace:', error);
    return null;
  }
}

/**
 * Get workspace contribution percentages
 */
export async function getWorkspaceContributions(
  workspaceId: string
): Promise<Array<WorkspaceInvoiceSummary & { contributionPercentage: number }>> {
  try {
    const result = await getInvoicesAcrossHierarchy(workspaceId);
    
    return result.workspaceSummaries.map(workspace => ({
      ...workspace,
      contributionPercentage: result.summary.totalAmount > 0 
        ? (workspace.totalAmount / result.summary.totalAmount) * 100 
        : 0
    }));
  } catch (error) {
    console.error('Error getting workspace contributions:', error);
    throw error;
  }
}

/**
 * Simple function to check if a workspace has sub-workspaces with invoices
 */
export async function hasSubWorkspaceInvoices(mainWorkspaceId: string): Promise<boolean> {
  try {
    const subWorkspaceInvoices = await InvoiceService.getSubWorkspaceInvoices(mainWorkspaceId, { limit: 1 });
    return subWorkspaceInvoices.length > 0;
  } catch (error) {
    console.error('Error checking sub-workspace invoices:', error);
    return false;
  }
}

/**
 * Get quick stats for dashboard display
 */
export async function getQuickHierarchyStats(workspaceId: string): Promise<{
  totalInvoices: number;
  totalRevenue: number;
  collectionRate: number;
  workspaceCount: number;
  hasSubWorkspaces: boolean;
}> {
  try {
    const result = await getInvoicesAcrossHierarchy(workspaceId, { limit: 1000 }); // Reasonable limit for stats
    
    return {
      totalInvoices: result.summary.totalInvoices,
      totalRevenue: result.summary.totalAmount,
      collectionRate: result.summary.collectionRate,
      workspaceCount: result.workspaceSummaries.length,
      hasSubWorkspaces: result.subWorkspaces.length > 0
    };
  } catch (error) {
    console.error('Error getting quick hierarchy stats:', error);
    return {
      totalInvoices: 0,
      totalRevenue: 0,
      collectionRate: 0,
      workspaceCount: 0,
      hasSubWorkspaces: false
    };
  }
}

// Export types for use in components
export type { Invoice } from '../types/financial-types';
export type { Workspace } from '../types';