/**
 * Example: How to determine invoices under every sub-workspace and main workspace
 * 
 * This file demonstrates the usage of the new hierarchical invoice methods
 * added to the InvoiceService class.
 */

import { InvoiceService } from '../lib/invoice-service';
import { WorkspaceService } from '../lib/workspace-service';

// Example 1: Get all invoices from a main workspace and its sub-workspaces
export async function getAllWorkspaceInvoices(mainWorkspaceId: string) {
  try {
    console.log('=== Getting All Workspace Invoices ===');
    
    // Method 1: Using getHierarchicalInvoices (recommended)
    const result = await InvoiceService.getHierarchicalInvoices(mainWorkspaceId, {
      includeSubWorkspaces: true, // Include all sub-workspaces
      status: undefined, // Get all statuses
      limit: 100 // Optional limit
    });
    
    console.log(`Total invoices across hierarchy: ${result.invoices.length}`);
    console.log('Workspace breakdown:', result.workspaceBreakdown);
    
    // Print breakdown by workspace
    Object.entries(result.workspaceBreakdown).forEach(([workspaceId, breakdown]) => {
      console.log(`${breakdown.name}: ${breakdown.count} invoices, $${breakdown.total.toFixed(2)}`);
    });
    
    return result;
  } catch (error) {
    console.error('Error getting all workspace invoices:', error);
    throw error;
  }
}

// Example 2: Get invoices only from sub-workspaces (excluding main workspace)
export async function getSubWorkspaceInvoicesOnly(mainWorkspaceId: string) {
  try {
    console.log('=== Getting Sub-Workspace Invoices Only ===');
    
    const subWorkspaceInvoices = await InvoiceService.getSubWorkspaceInvoices(mainWorkspaceId, {
      status: 'sent', // Only sent invoices
      startDate: new Date(2024, 0, 1), // From January 1, 2024
      endDate: new Date() // Until now
    });
    
    console.log(`Sub-workspace invoices: ${subWorkspaceInvoices.length}`);
    
    // Group by workspace for analysis
    const groupedByWorkspace = subWorkspaceInvoices.reduce((acc, invoice) => {
      if (!acc[invoice.workspaceId]) {
        acc[invoice.workspaceId] = [];
      }
      acc[invoice.workspaceId].push(invoice);
      return acc;
    }, {} as { [workspaceId: string]: any[] });
    
    console.log('Invoices by sub-workspace:', Object.keys(groupedByWorkspace).map(wsId => ({
      workspaceId: wsId,
      count: groupedByWorkspace[wsId].length
    })));
    
    return subWorkspaceInvoices;
  } catch (error) {
    console.error('Error getting sub-workspace invoices:', error);
    throw error;
  }
}

// Example 3: Get comprehensive analytics across the entire hierarchy
export async function getHierarchicalAnalytics(workspaceId: string) {
  try {
    console.log('=== Getting Hierarchical Analytics ===');
    
    const analytics = await InvoiceService.getHierarchicalInvoiceAnalytics(workspaceId, {
      start: new Date(2024, 0, 1), // From January 1, 2024
      end: new Date() // Until now
    }, true); // Include sub-workspaces
    
    console.log('Overall Analytics:');
    console.log(`- Total Invoices: ${analytics.totalInvoices}`);
    console.log(`- Total Amount: $${analytics.totalAmount.toFixed(2)}`);
    console.log(`- Paid Amount: $${analytics.paidAmount.toFixed(2)}`);
    console.log(`- Pending Amount: $${analytics.pendingAmount.toFixed(2)}`);
    console.log(`- Overdue Amount: $${analytics.overdueAmount.toFixed(2)}`);
    console.log(`- Average Invoice Value: $${analytics.averageInvoiceValue.toFixed(2)}`);
    console.log(`- Average Payment Time: ${analytics.paymentTimeAverage.toFixed(1)} days`);
    
    console.log('\nStatus Breakdown:');
    Object.entries(analytics.statusBreakdown).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} invoices`);
    });
    
    console.log('\nWorkspace Performance:');
    Object.entries(analytics.workspaceBreakdown).forEach(([workspaceId, breakdown]) => {
      const collectionRate = breakdown.totalAmount > 0 
        ? (breakdown.paidAmount / breakdown.totalAmount * 100).toFixed(1)
        : '0';
      console.log(`- ${breakdown.name}:`);
      console.log(`  * Invoices: ${breakdown.totalInvoices}`);
      console.log(`  * Total: $${breakdown.totalAmount.toFixed(2)}`);
      console.log(`  * Paid: $${breakdown.paidAmount.toFixed(2)}`);
      console.log(`  * Collection Rate: ${collectionRate}%`);
    });
    
    console.log('\nMonthly Trend:');
    analytics.monthlyTrend.slice(-6).forEach(trend => {
      console.log(`- ${trend.month}: ${trend.count} invoices, $${trend.amount.toFixed(2)}`);
    });
    
    return analytics;
  } catch (error) {
    console.error('Error getting hierarchical analytics:', error);
    throw error;
  }
}

// Example 4: Compare main workspace vs sub-workspaces performance
export async function compareWorkspacePerformance(mainWorkspaceId: string) {
  try {
    console.log('=== Comparing Workspace Performance ===');
    
    // Get main workspace analytics
    const mainAnalytics = await InvoiceService.getInvoiceAnalytics(mainWorkspaceId);
    
    // Get sub-workspace analytics
    const subWorkspaces = await WorkspaceService.getSubWorkspaces(mainWorkspaceId);
    const subAnalytics = [];
    
    for (const subWorkspace of subWorkspaces) {
      const analytics = await InvoiceService.getInvoiceAnalytics(subWorkspace.id);
      subAnalytics.push({
        workspace: subWorkspace,
        analytics
      });
    }
    
    // Compare performance
    console.log('Main Workspace Performance:');
    console.log(`- Total Revenue: $${mainAnalytics.totalAmount.toFixed(2)}`);
    console.log(`- Collection Rate: ${mainAnalytics.totalAmount > 0 ? (mainAnalytics.paidAmount / mainAnalytics.totalAmount * 100).toFixed(1) : '0'}%`);
    console.log(`- Average Invoice: $${mainAnalytics.averageInvoiceValue.toFixed(2)}`);
    
    console.log('\nSub-Workspace Performance:');
    subAnalytics.forEach(({ workspace, analytics }) => {
      const collectionRate = analytics.totalAmount > 0 
        ? (analytics.paidAmount / analytics.totalAmount * 100).toFixed(1)
        : '0';
      console.log(`- ${workspace.name}:`);
      console.log(`  * Revenue: $${analytics.totalAmount.toFixed(2)}`);
      console.log(`  * Collection Rate: ${collectionRate}%`);
      console.log(`  * Average Invoice: $${analytics.averageInvoiceValue.toFixed(2)}`);
    });
    
    // Find best performing sub-workspace
    if (subAnalytics.length > 0) {
      const bestPerformer = subAnalytics.reduce((best, current) => {
        const bestRate = best.analytics.totalAmount > 0 
          ? best.analytics.paidAmount / best.analytics.totalAmount 
          : 0;
        const currentRate = current.analytics.totalAmount > 0 
          ? current.analytics.paidAmount / current.analytics.totalAmount 
          : 0;
        return currentRate > bestRate ? current : best;
      });
      
      console.log(`\nBest Performing Sub-Workspace: ${bestPerformer.workspace.name}`);
    }
    
    return { mainAnalytics, subAnalytics };
  } catch (error) {
    console.error('Error comparing workspace performance:', error);
    throw error;
  }
}

// Example 5: Get invoices for a specific sub-workspace and its parent context
export async function getSubWorkspaceWithContext(subWorkspaceId: string) {
  try {
    console.log('=== Getting Sub-Workspace with Parent Context ===');
    
    // Get the sub-workspace details
    const subWorkspace = await WorkspaceService.getWorkspace(subWorkspaceId);
    if (!subWorkspace || subWorkspace.workspaceType !== 'sub') {
      throw new Error('Invalid sub-workspace ID');
    }
    
    // Get parent workspace
    const parentWorkspace = await WorkspaceService.getWorkspace(subWorkspace.parentWorkspaceId!);
    
    // Get invoices from this sub-workspace
    const subWorkspaceInvoices = await InvoiceService.getWorkspaceInvoices(subWorkspaceId);
    
    // Get all invoices from the parent hierarchy for context
    const hierarchicalResult = await InvoiceService.getHierarchicalInvoices(subWorkspace.parentWorkspaceId!);
    
    console.log(`Sub-Workspace: ${subWorkspace.name}`);
    console.log(`Parent Workspace: ${parentWorkspace?.name}`);
    console.log(`Sub-workspace invoices: ${subWorkspaceInvoices.length}`);
    console.log(`Total hierarchy invoices: ${hierarchicalResult.invoices.length}`);
    
    // Calculate sub-workspace contribution to parent
    const subWorkspaceTotal = subWorkspaceInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const hierarchyTotal = hierarchicalResult.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const contributionPercentage = hierarchyTotal > 0 
      ? (subWorkspaceTotal / hierarchyTotal * 100).toFixed(1)
      : '0';
    
    console.log(`Sub-workspace contribution: ${contributionPercentage}% of parent hierarchy`);
    
    return {
      subWorkspace,
      parentWorkspace,
      subWorkspaceInvoices,
      hierarchicalResult,
      contributionPercentage: parseFloat(contributionPercentage)
    };
  } catch (error) {
    console.error('Error getting sub-workspace with context:', error);
    throw error;
  }
}

// Usage examples:
/*
// Example usage in your application:

// 1. Get all invoices from main workspace and sub-workspaces
const allInvoices = await getAllWorkspaceInvoices('main-workspace-id');

// 2. Get only sub-workspace invoices
const subInvoices = await getSubWorkspaceInvoicesOnly('main-workspace-id');

// 3. Get comprehensive analytics
const analytics = await getHierarchicalAnalytics('workspace-id');

// 4. Compare performance
const comparison = await compareWorkspacePerformance('main-workspace-id');

// 5. Get sub-workspace with context
const context = await getSubWorkspaceWithContext('sub-workspace-id');
*/

export {
  // Re-export the new service methods for easy access
  InvoiceService
};