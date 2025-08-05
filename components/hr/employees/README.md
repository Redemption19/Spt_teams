# Employee Document Delete Dialog

This component provides a comprehensive delete confirmation dialog for employee documents using the custom delete UI component.

## Features

- **Rich Information Display**: Shows document details including name, type, upload date, expiry date, and notes
- **Employee Context**: Displays which employee the document belongs to
- **Consequences Warning**: Lists what will happen when the document is deleted
- **Loading State**: Shows loading indicator during deletion process
- **Error Handling**: Proper error handling with toast notifications
- **Consistent UI**: Uses the same delete dialog pattern as other parts of the application

## Usage

```tsx
import { EmployeeDocumentDeleteDialog } from '@/components/hr/employees/EmployeeDocumentDeleteDialog';

// In your component
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [documentToDelete, setDocumentToDelete] = useState<EmployeeDocument | null>(null);

// To open the dialog
const handleDeleteClick = (document: EmployeeDocument) => {
  setDocumentToDelete(document);
  setDeleteDialogOpen(true);
};

// Render the dialog
{employee && documentToDelete && deleteDialogOpen && (
  <EmployeeDocumentDeleteDialog
    document={documentToDelete}
    employeeId={employee.id}
    employeeName={`${employee.firstName} ${employee.lastName}`}
    onClose={() => {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }}
    onSuccess={loadEmployee} // Refresh data after deletion
  />
)}
```

## Props

- `document`: The EmployeeDocument object to be deleted
- `employeeId`: ID of the employee who owns the document
- `employeeName`: Display name of the employee
- `onClose`: Callback when dialog is closed
- `onSuccess`: Callback when deletion is successful (typically to refresh data)

## Integration

The component is integrated into the employee detail page (`/app/dashboard/hr/employees/[id]/page.tsx`) and replaces the simple `confirm()` dialog with a more user-friendly and informative delete confirmation.