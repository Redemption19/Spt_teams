# UI Integration Guide: Invoice Hierarchy

This guide shows you exactly how to see and use the invoice hierarchy functionality in your UI.

## Quick Integration (Recommended)

The fastest way to see the hierarchy functionality is to add it as a new tab to your existing invoice page.

### Step 1: Update Your Invoice Page

Open `app/dashboard/financial/invoices/page.tsx` and add the hierarchy tab:

```typescript
// Add this import at the top
import HierarchicalInvoiceView from '@/components/financial/HierarchicalInvoiceView';
import { Building2 } from 'lucide-react';

// In your component, update the TabsList to include hierarchy:
<TabsList className="grid w-full grid-cols-5"> {/* Changed from grid-cols-4 to grid-cols-5 */}
  <TabsTrigger value="list">List</TabsTrigger>
  <TabsTrigger value="create">Create</TabsTrigger>
  <TabsTrigger value="templates">Templates</TabsTrigger>
  <TabsTrigger value="clients">Clients</TabsTrigger>
  <TabsTrigger value="hierarchy">
    <Building2 className="w-4 h-4 mr-2" />
    Hierarchy
  </TabsTrigger>
</TabsList>

// Add this new TabsContent after your existing tabs:
<TabsContent value="hierarchy">
  {currentWorkspace && (
    <HierarchicalInvoiceView 
      workspaceId={currentWorkspace.id}
      className="mt-6"
    />
  )}
</TabsContent>
```

### Step 2: Test the Integration

1. Save the file
2. Go to your invoice page in the browser
3. Click on the new "Hierarchy" tab
4. You should see:
   - Overview with summary cards
   - Workspace breakdown
   - Analytics charts
   - Filtered invoice list

## Alternative: Toggle View Integration

If you prefer a toggle instead of a separate tab, add this to your invoice page header:

```typescript
// Add these imports
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import HierarchicalInvoiceView from '@/components/financial/HierarchicalInvoiceView';

// Add state for the toggle
const [showHierarchy, setShowHierarchy] = useState(false);

// Add this to your page header (where you have the title and buttons)
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Invoices</h1>
    <p className="text-gray-600">Manage your invoices</p>
  </div>
  
  <div className="flex items-center gap-4">
    {/* Your existing buttons */}
    
    {/* Add this toggle */}
    <div className="flex items-center space-x-2">
      <Switch
        id="hierarchy-view"
        checked={showHierarchy}
        onCheckedChange={setShowHierarchy}
      />
      <Label htmlFor="hierarchy-view">Hierarchy View</Label>
    </div>
  </div>
</div>

// Replace your main content area with:
{showHierarchy && currentWorkspace ? (
  <HierarchicalInvoiceView 
    workspaceId={currentWorkspace.id}
  />
) : (
  // Your existing invoice content (tabs, list, etc.)
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    {/* Your existing tabs content */}
  </Tabs>
)}
```

## What You'll See

Once integrated, the hierarchy view provides:

### 1. Overview Tab
- **Summary Cards**: Total invoices, amounts, collection rates
- **Cross-workspace Statistics**: Data from main + sub-workspaces
- **Real-time Calculations**: Paid, pending, overdue amounts

### 2. Workspaces Tab
- **Individual Workspace Cards**: Each workspace with its own metrics
- **Performance Indicators**: Collection rates, invoice counts
- **Visual Progress Bars**: Collection rate visualization

### 3. Analytics Tab
- **Performance Comparison**: Ranked workspace performance
- **Collection Efficiency**: Payment collection rates
- **Visual Charts**: Color-coded performance indicators

### 4. Invoice List Tab
- **Filtered Invoices**: Based on selected filters
- **Workspace Labels**: Shows which workspace each invoice belongs to
- **Status Indicators**: Visual status badges

## Available Filters

The hierarchy view includes several filters:

1. **Include Sub-workspaces**: Toggle to include/exclude sub-workspaces
2. **Status Filter**: All, Draft, Sent, Paid, Cancelled
3. **Workspace Type**: All Types, Main Only, Sub Only
4. **Specific Workspace**: Select individual workspace

## Key Features

### Real-time Data
- All data is fetched in real-time from your database
- Automatically calculates overdue invoices
- Updates when you switch filters

### Responsive Design
- Works on mobile, tablet, and desktop
- Cards stack on smaller screens
- Touch-friendly controls

### Performance Optimized
- Efficient data fetching
- Client-side filtering for fast interactions
- Skeleton loading states

## Usage Examples

### For Business Owners
1. **Monitor Overall Performance**: Use Overview tab to see total business performance
2. **Compare Locations**: Use Workspaces tab to compare different branches/regions
3. **Identify Issues**: Use Analytics tab to find underperforming areas

### For Managers
1. **Track Team Performance**: Filter by specific workspace
2. **Monitor Collections**: Focus on overdue invoices
3. **Generate Reports**: Export data for reporting

### For Accountants
1. **Reconcile Payments**: Filter by paid status
2. **Follow Up**: Focus on pending/overdue invoices
3. **Audit Trail**: View invoices across all workspaces

## Troubleshooting

### No Data Showing
- Ensure you have invoices in your workspace
- Check that sub-workspaces have been created
- Verify workspace permissions

### Performance Issues
- Use date filters to limit data range
- Consider pagination for large datasets
- Check network connection

### Permission Errors
- Ensure user has access to workspace
- Check if user can view invoices
- Verify workspace membership

## Next Steps

1. **Try the Integration**: Follow Step 1 above to add the hierarchy tab
2. **Customize Filters**: Adjust default filters based on your needs
3. **Add Export**: Implement CSV/PDF export functionality
4. **Create Dashboards**: Use the data for executive dashboards
5. **Set Up Alerts**: Add notifications for overdue invoices

## API Reference

The hierarchy view uses these new methods:

```typescript
// Get all invoices from hierarchy
const result = await getInvoicesAcrossHierarchy(workspaceId, {
  includeSubWorkspaces: true,
  status: 'sent',
  startDate: new Date('2024-01-01'),
  limit: 100
});

// Get only sub-workspace invoices
const subInvoices = await getInvoicesByWorkspaceType(workspaceId, 'sub');

// Get comprehensive analytics
const analytics = await InvoiceService.getHierarchicalInvoiceAnalytics(
  workspaceId,
  { start: new Date('2024-01-01'), end: new Date() },
  true
);
```

For complete API documentation, see `docs/INVOICE_HIERARCHY_GUIDE.md`.