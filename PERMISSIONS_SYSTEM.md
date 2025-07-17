# Granular Permissions System

## Overview

The Spt_teams application now includes a comprehensive granular permissions system that allows owners and admins to assign specific permissions to users beyond their basic roles. This system provides fine-grained control over what users can do within the system.

## Features

### 🔐 Granular Permission Controls
- **View Permissions**: Control what users can see
- **Create Permissions**: Control what users can create
- **Edit Permissions**: Control what users can modify
- **Delete Permissions**: Control what users can remove
- **Special Permissions**: Custom permissions for specific features

### 📊 Permission Categories
The system organizes permissions into logical categories:

1. **User Management** - Manage users, roles, and permissions
2. **Workspace Management** - Manage workspaces and settings
3. **Project Management** - Manage projects and tasks
4. **Team Management** - Manage teams and team members
5. **Organization Management** - Manage departments, branches, regions
6. **Content Management** - Manage folders and files
7. **Reporting** - Manage reports and analytics
8. **Communication** - Manage calendar and events
9. **System** - Manage settings, support, database, AI

### 🎯 Permission Templates
Pre-defined permission sets for common user types:
- **Full Access** - Complete system access (Owner)
- **Admin Access** - Administrative capabilities
- **Manager Access** - Team and project management
- **Standard Access** - Basic team member access
- **Limited Access** - Restricted access
- **View Only** - Read-only access

## Architecture

### Core Components

#### 1. Permissions Service (`lib/permissions-service.ts`)
- Handles all permission-related database operations
- Manages permission CRUD operations
- Provides permission checking utilities

#### 2. Permissions Dialog (`components/settings/user-management/permissions/permissions-dialog.tsx`)
- Main interface for managing user permissions
- Tabbed interface for different permission categories
- Real-time permission updates

#### 3. Permissions Summary (`components/settings/user-management/permissions/permissions-summary.tsx`)
- Quick overview of user permissions
- Visual indicators for permission types
- Tooltip with detailed information

#### 4. Permissions Templates (`components/settings/user-management/permissions/permissions-templates.tsx`)
- Pre-defined permission sets
- Quick application of common permission patterns
- Template customization

#### 5. Permissions Hook (`hooks/use-permissions.ts`)
- Reusable hook for permission management
- Permission checking utilities
- State management for permissions

### Database Schema

#### UserPermissions Collection
```typescript
interface UserPermission {
  userId: string;
  workspaceId: string;
  permissions: {
    [permissionId: string]: {
      granted: boolean;
      grantedBy?: string;
      grantedAt?: Date;
      expiresAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Permission Structure
```typescript
interface Permission {
  id: string;           // e.g., "users.view"
  name: string;         // e.g., "View Users"
  description: string;  // e.g., "Can view user list and profiles"
  category: string;     // e.g., "User Management"
  feature: string;      // e.g., "users"
}
```

## Usage

### Accessing Permissions

Permissions can be accessed through the User Management interface:

1. Navigate to **Settings > User Management**
2. Find the user you want to manage
3. Click the **Shield icon** or use the dropdown menu
4. Select **"Permissions & Privileges"**

### Managing Permissions

#### Individual Permission Management
1. Open the Permissions Dialog for a user
2. Navigate through different categories using tabs
3. Check/uncheck permissions as needed
4. Click "Save Permissions" to apply changes

#### Using Permission Templates
1. Open the Permissions Templates dialog
2. Choose a template that fits the user's role
3. Review the permissions included in the template
4. Apply the template to the user

### Permission Checking in Code

```typescript
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent({ userId, workspaceId }) {
  const { hasPermission, loading } = usePermissions({ userId, workspaceId });
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {hasPermission('users.edit') && (
        <button>Edit User</button>
      )}
      
      {hasPermission('projects.create') && (
        <button>Create Project</button>
      )}
    </div>
  );
}
```

## Permission Categories and Features

### User Management
- `users.view` - View user list and profiles
- `users.create` - Create new users
- `users.edit` - Edit user information
- `users.delete` - Delete users
- `users.invite` - Send user invitations
- `users.permissions` - Manage user permissions

### Workspace Management
- `workspaces.view` - View workspace information
- `workspaces.create` - Create new workspaces
- `workspaces.edit` - Edit workspace settings
- `workspaces.delete` - Delete workspaces

### Project Management
- `projects.view` - View project list and details
- `projects.create` - Create new projects
- `projects.edit` - Edit project information
- `projects.delete` - Delete projects
- `projects.assign` - Assign projects to users

### Task Management
- `tasks.view` - View task list and details
- `tasks.create` - Create new tasks
- `tasks.edit` - Edit task information
- `tasks.delete` - Delete tasks
- `tasks.assign` - Assign tasks to users
- `tasks.complete` - Mark tasks as complete

### Team Management
- `teams.view` - View team list and details
- `teams.create` - Create new teams
- `teams.edit` - Edit team information
- `teams.delete` - Delete teams
- `teams.members` - Add/remove team members

### Department Management
- `departments.view` - View department list and details
- `departments.create` - Create new departments
- `departments.edit` - Edit department information
- `departments.delete` - Delete departments
- `departments.members` - Add/remove department members

### Branch Management
- `branches.view` - View branch list and details
- `branches.create` - Create new branches
- `branches.edit` - Edit branch information
- `branches.delete` - Delete branches

### Region Management
- `regions.view` - View region list and details
- `regions.create` - Create new regions
- `regions.edit` - Edit region information
- `regions.delete` - Delete regions

### Folder Management
- `folders.view` - View folder list and contents
- `folders.create` - Create new folders
- `folders.edit` - Edit folder information
- `folders.delete` - Delete folders
- `folders.assign` - Assign folders to users/teams

### Report Management
- `reports.view` - View report list and details
- `reports.create` - Create new reports
- `reports.edit` - Edit report information
- `reports.delete` - Delete reports
- `reports.approve` - Approve submitted reports
- `reports.export` - Export reports to various formats

### Analytics
- `analytics.view` - View analytics and dashboard data
- `analytics.export` - Export analytics data

### Calendar Management
- `calendar.view` - View calendar events
- `calendar.create` - Create calendar events
- `calendar.edit` - Edit calendar events
- `calendar.delete` - Delete calendar events

### Settings
- `settings.view` - View system settings
- `settings.edit` - Edit system settings

### Support
- `support.view` - View support tickets
- `support.create` - Create support tickets
- `support.edit` - Edit support tickets
- `support.resolve` - Resolve support tickets

### Database Management
- `database.view` - View database information
- `database.backup` - Create database backups
- `database.restore` - Restore database from backup

### AI Assistant
- `ai.view` - Access AI assistant features
- `ai.configure` - Configure AI assistant settings

## Security Considerations

### Permission Inheritance
- Permissions are workspace-specific
- Users can have different permissions in different workspaces
- Role-based permissions are separate from granular permissions

### Permission Expiration
- Permissions can have expiration dates
- Expired permissions are automatically disabled
- Temporary permissions can be set for specific time periods

### Audit Trail
- All permission changes are logged
- Track who granted permissions and when
- Maintain history of permission modifications

## Best Practices

### Permission Assignment
1. **Start with templates** - Use predefined templates as starting points
2. **Follow principle of least privilege** - Grant only necessary permissions
3. **Regular reviews** - Periodically review and update user permissions
4. **Documentation** - Document custom permission sets for consistency

### Performance Considerations
1. **Caching** - Permissions are cached to improve performance
2. **Lazy loading** - Permission data is loaded only when needed
3. **Optimized queries** - Database queries are optimized for permission checks

### User Experience
1. **Clear indicators** - Visual indicators show permission status
2. **Intuitive interface** - Easy-to-use permission management interface
3. **Helpful tooltips** - Detailed information about each permission
4. **Bulk operations** - Support for applying permissions to multiple users

## Troubleshooting

### Common Issues

#### Permissions Not Updating
- Check if the user has permission to manage permissions
- Verify that the workspace ID is correct
- Ensure the current user has admin/owner role

#### Permission Checks Failing
- Verify that the permission ID is correct
- Check if the permission has expired
- Ensure the user is in the correct workspace

#### Template Application Issues
- Verify that the template exists and is properly configured
- Check if the user has permission to apply templates
- Ensure all required permissions are available

### Debug Information
The system provides detailed logging for permission operations:
- Permission loading and saving
- Template application
- Permission validation
- Error handling

## Future Enhancements

### Planned Features
1. **Permission Groups** - Create custom permission groups
2. **Conditional Permissions** - Permissions based on conditions
3. **Permission Analytics** - Track permission usage
4. **Advanced Templates** - More sophisticated template options
5. **Bulk Permission Management** - Manage permissions for multiple users

### Integration Opportunities
1. **Workflow Integration** - Permissions based on workflow states
2. **Time-based Permissions** - Automatic permission scheduling
3. **Location-based Permissions** - Permissions based on user location
4. **Device-based Permissions** - Permissions based on device type

## Support

For questions or issues with the permissions system:
1. Check the troubleshooting section above
2. Review the permission logs for errors
3. Contact the system administrator
4. Refer to the API documentation for technical details 