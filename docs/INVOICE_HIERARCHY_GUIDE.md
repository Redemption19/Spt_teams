# Invoice Hierarchy Management Guide

This guide explains how to determine and manage invoices across workspace hierarchies, including main workspaces and their sub-workspaces.

## Overview

The invoice system now supports hierarchical workspace structures where:
- **Main Workspaces** are top-level workspaces that can contain sub-workspaces
- **Sub-Workspaces** are child workspaces that belong to a main workspace
- **Invoices** are scoped to specific workspaces but can be queried across the hierarchy

## New Methods Available

### 1. `getHierarchicalInvoices(workspaceId, options)`

Retrieves invoices from the entire workspace hierarchy (main + all sub-workspaces).

```typescript
const result = await InvoiceService.getHierarchicalInvoices('workspace-id', {
  status: 'sent', // Optional: filter by status
  clientId: 'client-id', // Optional: filter by client
  startDate: new Date('2024-01-01'), // Optional: date range
  endDate: new Date(), // Optional: date range
  includeSubWorkspaces: true, // Default: true
  limit: 100 // Optional: limit results
});

// Returns:
// {
//   invoices: Invoice[], // All invoices from hierarchy
//   workspaceBreakdown: { // Breakdown by workspace
//     [workspaceId]: {
//       name: string,
//       count: number,
//       total: number
//     }
//   }
// }
```

### 2. `getSubWorkspaceInvoices(mainWorkspaceId, options)`

Retrieves invoices only from sub-workspaces (excludes main workspace).

```typescript
const subInvoices = await InvoiceService.getSubWorkspaceInvoices('main-workspace-id', {
  status: 'paid',
  startDate: new Date('2024-01-01'),
  limit: 50
});

// Returns: Invoice[] from all sub-workspaces
```

### 3. `getHierarchicalInvoiceAnalytics(workspaceId, dateRange, includeSubWorkspaces)`

Provides comprehensive analytics across the workspace hierarchy.

```typescript
const analytics = await InvoiceService.getHierarchicalInvoiceAnalytics(
  'workspace-id',
  { start: new Date('2024-01-01'), end: new Date() },
  true // Include sub-workspaces
);

// Returns detailed analytics with workspace breakdown
```

## Common Use Cases

### 1. Dashboard Overview - All Workspace Invoices

```typescript
// Get all invoices from main workspace and sub-workspaces
async function getDashboardData(mainWorkspaceId: string) {
  const result = await InvoiceService.getHierarchicalInvoices(mainWorkspaceId, {
    includeSubWorkspaces: true
  });
  
  return {
    totalInvoices: result.invoices.length,
    totalAmount: result.invoices.reduce((sum, inv) => sum + inv.total, 0),
    workspaceBreakdown: result.workspaceBreakdown
  };
}
```

### 2. Regional Performance Analysis

```typescript
// Compare performance across sub-workspaces (regions/branches)
async function analyzeRegionalPerformance(mainWorkspaceId: string) {
  const analytics = await InvoiceService.getHierarchicalInvoiceAnalytics(mainWorkspaceId);
  
  // Analyze each sub-workspace performance
  const regionPerformance = Object.entries(analytics.workspaceBreakdown)
    .map(([workspaceId, data]) => ({
      workspaceId,
      name: data.name,
      revenue: data.totalAmount,
      collectionRate: data.totalAmount > 0 ? (data.paidAmount / data.totalAmount) * 100 : 0,
      invoiceCount: data.totalInvoices
    }))
    .sort((a, b) => b.revenue - a.revenue);
  
  return regionPerformance;
}
```

### 3. Sub-Workspace Specific Reports

```typescript
// Get invoices for a specific sub-workspace with parent context
async function getSubWorkspaceReport(subWorkspaceId: string) {
  const subWorkspace = await WorkspaceService.getWorkspace(subWorkspaceId);
  
  if (subWorkspace?.workspaceType === 'sub' && subWorkspace.parentWorkspaceId) {
    // Get sub-workspace invoices
    const subInvoices = await InvoiceService.getWorkspaceInvoices(subWorkspaceId);
    
    // Get parent hierarchy for context
    const hierarchyData = await InvoiceService.getHierarchicalInvoices(
      subWorkspace.parentWorkspaceId
    );
    
    // Calculate contribution percentage
    const subTotal = subInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const hierarchyTotal = hierarchyData.invoices.reduce((sum, inv) => sum + inv.total, 0);
    const contribution = hierarchyTotal > 0 ? (subTotal / hierarchyTotal) * 100 : 0;
    
    return {
      subWorkspace,
      invoices: subInvoices,
      contributionToParent: contribution,
      parentHierarchy: hierarchyData
    };
  }
  
  throw new Error('Invalid sub-workspace');
}
```

### 4. Cross-Workspace Invoice Search

```typescript
// Search for invoices across all accessible workspaces
async function searchInvoicesAcrossWorkspaces(
  userId: string, 
  searchTerm: string
) {
  // Get user's accessible workspaces
  const { mainWorkspaces, subWorkspaces } = await WorkspaceService.getUserAccessibleWorkspaces(userId);
  
  const allInvoices: Invoice[] = [];
  
  // Search in main workspaces
  for (const workspace of mainWorkspaces) {
    const result = await InvoiceService.getHierarchicalInvoices(workspace.id);
    allInvoices.push(...result.invoices);
  }
  
  // Filter by search term
  return allInvoices.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
```

### 5. Consolidated Financial Reporting

```typescript
// Generate consolidated financial report across hierarchy
async function generateConsolidatedReport(mainWorkspaceId: string, dateRange: { start: Date; end: Date }) {
  const analytics = await InvoiceService.getHierarchicalInvoiceAnalytics(
    mainWorkspaceId,
    dateRange,
    true
  );
  
  return {
    summary: {
      totalRevenue: analytics.totalAmount,
      collectedRevenue: analytics.paidAmount,
      pendingRevenue: analytics.pendingAmount,
      overdueRevenue: analytics.overdueAmount,
      collectionRate: analytics.totalAmount > 0 ? (analytics.paidAmount / analytics.totalAmount) * 100 : 0,
      averageInvoiceValue: analytics.averageInvoiceValue,
      averagePaymentTime: analytics.paymentTimeAverage
    },
    workspaceBreakdown: analytics.workspaceBreakdown,
    monthlyTrend: analytics.monthlyTrend,
    statusDistribution: analytics.statusBreakdown
  };
}
```

## Best Practices

### 1. Permission Checking

Always verify user permissions before accessing workspace invoices:

```typescript
async function getInvoicesWithPermissionCheck(userId: string, workspaceId: string) {
  // Check if user has access to workspace
  const userRole = await WorkspaceService.getUserRole(userId, workspaceId);
  
  if (!userRole) {
    throw new Error('Access denied: User not member of workspace');
  }
  
  // Owners can see all hierarchy, others see only their workspace
  if (userRole === 'owner') {
    return InvoiceService.getHierarchicalInvoices(workspaceId);
  } else {
    return InvoiceService.getWorkspaceInvoices(workspaceId);
  }
}
```

### 2. Performance Optimization

For large hierarchies, use pagination and filtering:

```typescript
async function getInvoicesOptimized(workspaceId: string, page: number = 1, pageSize: number = 50) {
  const result = await InvoiceService.getHierarchicalInvoices(workspaceId, {
    limit: pageSize,
    // Add date filters to reduce data load
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
  });
  
  // Implement client-side pagination if needed
  const startIndex = (page - 1) * pageSize;
  const paginatedInvoices = result.invoices.slice(startIndex, startIndex + pageSize);
  
  return {
    invoices: paginatedInvoices,
    totalCount: result.invoices.length,
    workspaceBreakdown: result.workspaceBreakdown,
    hasMore: result.invoices.length > startIndex + pageSize
  };
}
```

### 3. Error Handling

```typescript
async function safeGetHierarchicalInvoices(workspaceId: string) {
  try {
    return await InvoiceService.getHierarchicalInvoices(workspaceId);
  } catch (error) {
    console.error('Error fetching hierarchical invoices:', error);
    
    // Fallback to single workspace if hierarchy fails
    try {
      const invoices = await InvoiceService.getWorkspaceInvoices(workspaceId);
      return {
        invoices,
        workspaceBreakdown: {
          [workspaceId]: {
            name: 'Current Workspace',
            count: invoices.length,
            total: invoices.reduce((sum, inv) => sum + inv.total, 0)
          }
        }
      };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Unable to fetch invoices');
    }
  }
}
```

## Migration Guide

If you're updating existing code to use hierarchical invoice methods:

### Before (Single Workspace)
```typescript
// Old way - single workspace only
const invoices = await InvoiceService.getWorkspaceInvoices(workspaceId);
const analytics = await InvoiceService.getInvoiceAnalytics(workspaceId);
```

### After (Hierarchical)
```typescript
// New way - includes sub-workspaces
const result = await InvoiceService.getHierarchicalInvoices(workspaceId);
const invoices = result.invoices;
const analytics = await InvoiceService.getHierarchicalInvoiceAnalytics(workspaceId);
```

## API Reference

For complete API documentation, see the method signatures in `lib/invoice-service.ts`:

- `getHierarchicalInvoices(workspaceId, options)` - Get invoices from hierarchy
- `getSubWorkspaceInvoices(mainWorkspaceId, options)` - Get sub-workspace invoices only
- `getHierarchicalInvoiceAnalytics(workspaceId, dateRange, includeSubWorkspaces)` - Get hierarchy analytics
- `getWorkspaceInvoices(workspaceId, options)` - Get single workspace invoices (existing method)
- `getInvoiceAnalytics(workspaceId, dateRange)` - Get single workspace analytics (existing method)

## Examples

See `examples/invoice-hierarchy-usage.ts` for complete working examples of all use cases.